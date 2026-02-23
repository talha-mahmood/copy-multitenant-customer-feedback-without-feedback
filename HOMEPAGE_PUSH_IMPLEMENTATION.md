# Homepage Push Feature Implementation Documentation

**Feature:** Super Admin Homepage Coupon & Ad Placement with Payment Integration  
**Date Started:** February 23, 2026  
**Status:** Phase 1 Complete - Database Schema & Settings

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Business Flow](#business-flow)
3. [Technical Architecture](#technical-architecture)
4. [Phase 1: Database Schema & Settings (COMPLETED)](#phase-1-completed)
5. [Phase 2: Backend - Request Creation & Agent Forwarding (PENDING)](#phase-2-pending)
6. [Phase 3: Backend - Super Admin Approval & Payment (PENDING)](#phase-3-pending)
7. [Phase 4: Backend - Homepage Display Endpoints (PENDING)](#phase-4-pending)
8. [Phase 5: Frontend - Merchant Interface (PENDING)](#phase-5-pending)
9. [Phase 6: Frontend - Agent Interface (PENDING)](#phase-6-pending)
10. [Phase 7: Frontend - Super Admin Interface (PENDING)](#phase-7-pending)

---

## 🎯 Overview

### Feature Description
Merchants can request to place their coupons or ads on the **Super Admin Homepage** for maximum visibility. The request flows through their assigned agent for approval before reaching the super admin. Upon super admin approval, the merchant pays through the agent's Stripe account, and the platform cost is automatically deducted from the agent's wallet balance.

### Key Features
- ✅ Two separate request types: Coupon Push & Ad Push
- ✅ Multi-stage approval: Merchant → Agent → Super Admin
- ✅ Payment integration with agent's Stripe
- ✅ Automatic wallet deduction from agent (goes to platform)
- ✅ Configurable pricing and limits by super admin
- ✅ Time-based expiry system
- ✅ Slot management (10 coupons, 4 ads max)

---

## 🔄 Business Flow

### Complete Request Workflow

```
1. MERCHANT CREATES REQUEST
   ├─ Type: Homepage Coupon Push OR Homepage Ad Push
   ├─ Selects existing coupon/ad OR creates new one
   ├─ Sees estimated cost from super admin settings
   └─ Status: "pending_agent_review"

2. AGENT REVIEWS REQUEST
   ├─ Option A: DISAPPROVE
   │   ├─ Provides reason
   │   └─ Status: "disapproved_by_agent" → END
   └─ Option B: FORWARD TO SUPER ADMIN
       ├─ Set forwarded_by_agent = true
       └─ Status: "forwarded_to_superadmin"

3. SUPER ADMIN REVIEWS REQUEST  
   ├─ Views all forwarded requests
   ├─ Checks available slots (max 10 coupons, 4 ads)
   ├─ Option A: REJECT
   │   ├─ Provides reason
   │   └─ Status: "rejected_by_superadmin" → END
   └─ Option B: APPROVE
       └─ Status: "approved_pending_payment"

4. MERCHANT MAKES PAYMENT
   ├─ Stripe checkout to agent's Stripe account
   ├─ Payment amount based on type:
   │   ├─ Coupon: homepage_coupon_placement_cost (default: $50)
   │   └─ Ad: homepage_ad_placement_cost (default: $100)
   ├─ Backend checks agent wallet balance
   ├─ If insufficient balance → Payment fails with error
   ├─ If sufficient balance:
   │   ├─ Deduct cost from agent's wallet (to platform)
   │   ├─ Set payment_status = "paid"
   │   ├─ Set ad_created_at = NOW()
   │   ├─ Set ad_expired_at = NOW() + duration_days
   │   └─ Status: "payment_completed_active"

5. HOMEPAGE DISPLAY
   ├─ Item appears on super admin homepage
   ├─ Visible to all users visiting homepage
   ├─ Remains active until ad_expired_at
   └─ After expiry → Status: "expired" (auto-removed)
```

### Payment Flow Detail

```
Merchant Payment → Agent's Stripe Account
                    ↓
         Agent Receives Full Amount
                    ↓
    Backend Deducts Cost from Agent Wallet
                    ↓
         Platform (Super Admin) Receives Cost
```

**Example:**
- Coupon homepage placement cost: $50
- Merchant pays $50 → Agent's Stripe
- Agent's wallet: -$50 (goes to platform)
- Agent keeps: $0 (payment is platform cost)

---

## 🏗️ Technical Architecture

### Database Schema Changes

#### **Approval Entity (New Columns)**

| Column Name | Type | Default | Description |
|------------|------|---------|-------------|
| `coupon_id` | INTEGER | NULL | Foreign key to coupons table |
| `forwarded_by_agent` | BOOLEAN | FALSE | Tracks if agent forwarded request |
| `payment_status` | VARCHAR(20) | 'pending' | Payment status: pending/paid/refunded |
| `payment_amount` | DECIMAL(10,2) | NULL | Amount paid for placement |
| `payment_intent_id` | VARCHAR(255) | NULL | Stripe payment intent ID |
| `disapproval_reason` | TEXT | NULL | Reason if disapproved by agent/super admin |

**Foreign Key:**
```sql
ALTER TABLE approvals 
ADD CONSTRAINT fk_approval_coupon 
FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE;
```

#### **Super Admin Settings Entity (New Columns)**

| Column Name | Type | Default | Description |
|------------|------|---------|-------------|
| `homepage_coupon_placement_cost` | DECIMAL(10,2) | 50.00 | Cost to place coupon on homepage |
| `homepage_ad_placement_cost` | DECIMAL(10,2) | 100.00 | Cost to place ad on homepage |
| `max_homepage_coupons` | INTEGER | 10 | Maximum coupons on homepage |
| `max_homepage_ads` | INTEGER | 4 | Maximum ads on homepage |
| `coupon_homepage_placement_duration_days` | INTEGER | 7 | Coupon placement duration |
| `ad_homepage_placement_duration_days` | INTEGER | 7 | Ad placement duration |

### New Approval Types

| Approval Type | Description | Entity Reference |
|--------------|-------------|------------------|
| `homepage_coupon_push` | Request to place coupon on super admin homepage | Coupon (via coupon_id) |
| `homepage_ad_push` | Request to place ad on super admin homepage | Merchant settings (ad details) |

### Status Flow

```
pending_agent_review         (Initial state - merchant creates)
    ↓
disapproved_by_agent        (Agent rejects) → END
    OR
forwarded_to_superadmin     (Agent forwards)
    ↓
rejected_by_superadmin      (Super admin rejects) → END
    OR
approved_pending_payment    (Super admin approves)
    ↓
payment_completed_active    (Merchant pays successfully)
    ↓
expired                     (After duration expires)
```

---

## ✅ Phase 1: Database Schema & Settings (COMPLETED)

### Files Created

#### 1. Migration: Approval Entity Enhancement
**File:** `src/database/migrations/1770700000000-add-homepage-push-fields-to-approvals.ts`

**What it does:**
- Adds 6 new columns to `approvals` table
- Creates foreign key relationship to `coupons` table
- Implements proper rollback in `down()` method

**Columns Added:**
```typescript
coupon_id: INTEGER NULL
forwarded_by_agent: BOOLEAN DEFAULT FALSE
payment_status: VARCHAR(20) DEFAULT 'pending'
payment_amount: DECIMAL(10,2) NULL
payment_intent_id: VARCHAR(255) NULL
disapproval_reason: TEXT NULL
```

#### 2. Migration: Super Admin Settings Enhancement
**File:** `src/database/migrations/1770700000001-add-homepage-placement-settings-to-super-admin-settings.ts`

**What it does:**
- Adds 6 new configuration columns to `super_admin_settings` table
- Sets sensible default values
- Implements proper rollback

**Columns Added:**
```typescript
homepage_coupon_placement_cost: DECIMAL(10,2) DEFAULT 50.00
homepage_ad_placement_cost: DECIMAL(10,2) DEFAULT 100.00
max_homepage_coupons: INT DEFAULT 10
max_homepage_ads: INT DEFAULT 4
coupon_homepage_placement_duration_days: INT DEFAULT 7
ad_homepage_placement_duration_days: INT DEFAULT 7
```

### Files Modified

#### 1. Approval Entity
**File:** `src/modules/approvals/entities/approval.entity.ts`

**Changes:**
- Added import for `Coupon` entity
- Added `@ManyToOne` relationship to Coupon
- Added 6 new columns with proper decorators and types
- All new fields are nullable/optional to maintain backward compatibility

**New Fields:**
```typescript
@Column({ name: 'coupon_id', nullable: true })
coupon_id: number;

@ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'coupon_id' })
coupon: Coupon;

@Column({ name: 'forwarded_by_agent', type: 'boolean', default: false })
forwarded_by_agent: boolean;

@Column({ name: 'payment_status', type: 'varchar', length: 20, default: 'pending' })
payment_status: string;

@Column({ name: 'payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
payment_amount: number;

@Column({ name: 'payment_intent_id', type: 'varchar', length: 255, nullable: true })
payment_intent_id: string;

@Column({ name: 'disapproval_reason', type: 'text', nullable: true })
disapproval_reason: string;
```

#### 2. Super Admin Settings Entity
**File:** `src/modules/super-admin-settings/entities/super-admin-settings.entity.ts`

**Changes:**
- Added 6 new configuration columns
- All with sensible defaults for immediate use
- Separated duration into two fields for coupons and ads

**New Fields:**
```typescript
@Column({ name: 'homepage_coupon_placement_cost', type: 'decimal', precision: 10, scale: 2, default: 50.00 })
homepage_coupon_placement_cost: number;

@Column({ name: 'homepage_ad_placement_cost', type: 'decimal', precision: 10, scale: 2, default: 100.00 })
homepage_ad_placement_cost: number;

@Column({ name: 'max_homepage_coupons', type: 'int', default: 10 })
max_homepage_coupons: number;

@Column({ name: 'max_homepage_ads', type: 'int', default: 4 })
max_homepage_ads: number;

@Column({ name: 'coupon_homepage_placement_duration_days', type: 'int', default: 7 })
coupon_homepage_placement_duration_days: number;

@Column({ name: 'ad_homepage_placement_duration_days', type: 'int', default: 7 })
ad_homepage_placement_duration_days: number;
```

#### 3. Create Approval DTO
**File:** `src/modules/approvals/dto/create-approval.dto.ts`

**Changes:**
- Added import for `Coupon` entity
- Added validation decorators for 6 new optional fields
- Used `@Exists` decorator for coupon_id validation

**New Fields:**
```typescript
@Exists(() => Coupon, 'id', { message: 'Coupon must exist' })
@IsOptional()
@IsNumber()
coupon_id?: number;

@IsOptional()
@IsBoolean()
forwarded_by_agent?: boolean;

@IsOptional()
@IsString()
payment_status?: string;

@IsOptional()
@IsNumber()
payment_amount?: number;

@IsOptional()
@IsString()
payment_intent_id?: string;

@IsOptional()
@IsString()
disapproval_reason?: string;
```

#### 4. Update Super Admin Settings DTO
**File:** `src/modules/super-admin-settings/dto/update-settings.dto.ts`

**Changes:**
- Added validation for 6 new settings fields
- Used `@Min(1)` for counts and durations
- Used `@Min(0)` for costs

**New Fields:**
```typescript
@IsOptional()
@IsNumber()
@Min(0)
homepage_coupon_placement_cost?: number;

@IsOptional()
@IsNumber()
@Min(0)
homepage_ad_placement_cost?: number;

@IsOptional()
@IsNumber()
@Min(1)
max_homepage_coupons?: number;

@IsOptional()
@IsNumber()
@Min(1)
max_homepage_ads?: number;

@IsOptional()
@IsNumber()
@Min(1)
coupon_homepage_placement_duration_days?: number;

@IsOptional()
@IsNumber()
@Min(1)
ad_homepage_placement_duration_days?: number;
```

### How to Apply Phase 1 Changes

```bash
cd boilerplate-backend
npm run migration:run
```

This will execute both migration files in order.

### Phase 1 Testing Checklist

- [ ] Migrations run without errors
- [ ] New columns exist in `approvals` table
- [ ] New columns exist in `super_admin_settings` table
- [ ] Foreign key constraint created for `coupon_id`
- [ ] Default values set correctly
- [ ] Super admin settings API returns new fields
- [ ] Update super admin settings API accepts new fields

---

## 📝 Phase 2: Backend - Request Creation & Agent Forwarding (PENDING)

### Planned Service Methods

#### ApprovalService

```typescript
// Merchant creates homepage coupon push request
async createHomepageCouponRequest(merchantId: number, couponId: number): Promise<Approval>

// Merchant creates homepage ad push request  
async createHomepageAdRequest(merchantId: number, adDetails: any): Promise<Approval>

// Agent forwards request to super admin
async forwardToSuperAdmin(approvalId: number, agentId: number): Promise<Approval>

// Agent disapproves request
async disapproveByAgent(approvalId: number, agentId: number, reason: string): Promise<Approval>

// Get pending requests for specific agent
async getPendingRequestsForAgent(agentId: number): Promise<Approval[]>

// Get forwarded requests for super admin/ad approvers
async getForwardedRequestsForSuperAdmin(): Promise<Approval[]>
```

### Planned Controller Endpoints

```typescript
POST   /approvals/homepage-coupon-push      // Merchant creates coupon request
POST   /approvals/homepage-ad-push          // Merchant creates ad request
PATCH  /approvals/:id/forward-to-superadmin // Agent forwards request
PATCH  /approvals/:id/disapprove-by-agent   // Agent disapproves request
GET    /approvals/agent-pending             // Agent's pending requests
GET    /approvals/superadmin-forwarded      // Super admin's forwarded requests
```

### Planned DTOs

```typescript
// CreateHomepageCouponRequestDto
{
  coupon_id: number;
}

// CreateHomepageAdRequestDto
{
  ad_image?: string;
  ad_video?: string;
  placement?: string;
}

// ForwardToSuperAdminDto
{
  // No additional fields needed, uses approvalId from route
}

// DisapproveDto
{
  reason: string;
}
```

---

## 💰 Phase 3: Backend - Super Admin Approval & Payment (PENDING)

### Planned Service Methods

#### ApprovalService

```typescript
// Super admin approves request (sets status to approved_pending_payment)
async approveBySuperAdmin(approvalId: number, superAdminId: number): Promise<Approval>

// Super admin rejects request
async rejectBySuperAdmin(approvalId: number, superAdminId: number, reason: string): Promise<Approval>

// Process payment for approved homepage placement
async processHomepagePlacementPayment(
  approvalId: number, 
  merchantId: number, 
  paymentMethodId: string
): Promise<Approval>

// Check available homepage slots
async getAvailableHomepageSlots(): Promise<{
  coupons: { available: number, max: number },
  ads: { available: number, max: number }
}>
```

### Business Logic

#### Payment Processing Flow

```typescript
async processHomepagePlacementPayment(approvalId, merchantId, paymentMethodId) {
  // 1. Get approval and validate
  const approval = await findApproval(approvalId);
  if (approval.approval_status !== 'approved_pending_payment') {
    throw new Error('Approval not ready for payment');
  }

  // 2. Get merchant and agent details
  const merchant = await getMerchant(merchantId);
  const agent = await getAgent(merchant.admin_id);

  // 3. Get pricing from super admin settings
  const settings = await getSuperAdminSettings();
  const cost = approval.approval_type === 'homepage_coupon_push' 
    ? settings.homepage_coupon_placement_cost 
    : settings.homepage_ad_placement_cost;

  // 4. Check agent wallet balance
  const agentWallet = await getAgentWallet(agent.id);
  if (agentWallet.balance < cost) {
    throw new Error('Insufficient agent wallet balance');
  }

  // 5. Create Stripe payment intent (to agent's Stripe)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: cost * 100, // Convert to cents
    currency: settings.currency.toLowerCase(),
    payment_method: paymentMethodId,
    confirm: true,
    // Use agent's Stripe account
  });

  // 6. On successful payment, deduct from agent wallet
  await deductFromAgentWallet(agent.id, cost, {
    description: `Homepage placement for ${approval.approval_type}`,
    approval_id: approvalId,
  });

  // 7. Set expiry dates
  const duration = approval.approval_type === 'homepage_coupon_push'
    ? settings.coupon_homepage_placement_duration_days
    : settings.ad_homepage_placement_duration_days;
  
  const created_at = new Date();
  const expired_at = new Date(created_at);
  expired_at.setDate(expired_at.getDate() + duration);

  // 8. Update approval
  await updateApproval(approvalId, {
    payment_status: 'paid',
    payment_amount: cost,
    payment_intent_id: paymentIntent.id,
    approval_status: 'payment_completed_active',
    ad_created_at: created_at,
    ad_expired_at: expired_at,
    placement: assignNextAvailableSlot(approval.approval_type),
  });

  return approval;
}
```

#### Slot Assignment Logic

```typescript
async assignNextAvailableSlot(approvalType: string): Promise<string> {
  const activeApprovals = await getActiveHomepageApprovals(approvalType);
  
  if (approvalType === 'homepage_coupon_push') {
    // Find first available slot from homepage_coupon_slot_1 to homepage_coupon_slot_10
    const occupiedSlots = activeApprovals.map(a => a.placement);
    for (let i = 1; i <= 10; i++) {
      const slot = `homepage_coupon_slot_${i}`;
      if (!occupiedSlots.includes(slot)) {
        return slot;
      }
    }
    throw new Error('No available coupon slots');
  } else {
    // Find first available slot from homepage_ad_slot_1 to homepage_ad_slot_4
    const occupiedSlots = activeApprovals.map(a => a.placement);
    for (let i = 1; i <= 4; i++) {
      const slot = `homepage_ad_slot_${i}`;
      if (!occupiedSlots.includes(slot)) {
        return slot;
      }
    }
    throw new Error('No available ad slots');
  }
}
```

### Planned Controller Endpoints

```typescript
PATCH  /approvals/:id/approve-by-superadmin    // Super admin approves
PATCH  /approvals/:id/reject-by-superadmin     // Super admin rejects
POST   /approvals/:id/process-payment          // Merchant pays after approval
GET    /approvals/available-homepage-slots     // Get available slots
```

---

## 🏠 Phase 4: Backend - Homepage Display Endpoints (PENDING)

### Planned Service Methods

```typescript
// Get all active homepage coupons (for public display)
async getActiveHomepageCoupons(): Promise<Approval[]>

// Get all active homepage ads (for public display)
async getActiveHomepageAds(): Promise<Approval[]>
```

### Planned Controller Endpoints

```typescript
GET /approvals/homepage-coupons    // Public: Active homepage coupons
GET /approvals/homepage-ads        // Public: Active homepage ads
```

### Response Format

```typescript
// Homepage Coupons Response
{
  coupons: [
    {
      id: 1,
      coupon: { /* full coupon details */ },
      merchant: { /* merchant details */ },
      placement: "homepage_coupon_slot_1",
      ad_created_at: "2026-02-23T10:00:00Z",
      ad_expired_at: "2026-03-02T10:00:00Z"
    }
  ]
}

// Homepage Ads Response
{
  ads: [
    {
      id: 2,
      merchant: { /* merchant details with ad settings */ },
      placement: "homepage_ad_slot_1",
      ad_created_at: "2026-02-23T10:00:00Z",
      ad_expired_at: "2026-03-02T10:00:00Z"
    }
  ]
}
```

---

## 🎨 Phase 5: Frontend - Merchant Interface (PENDING)

### Pages/Components to Create

#### 1. Merchant Dashboard - Homepage Push Section
**Location:** `src/containers/merchant/dashboard/homepage-push-section.jsx`

**Features:**
- Two prominent buttons:
  - "Push Coupon to Homepage" 
  - "Push Ad to Homepage"
- Show current pricing from settings
- Display active/pending requests count

#### 2. Create Coupon Push Request Modal
**Location:** `src/containers/merchant/homepage-push/create-coupon-request-modal.jsx`

**Features:**
- Dropdown to select existing coupon
- OR button to create new coupon specifically for homepage
- Coupon preview (image, title, description)
- Show estimated cost
- Submit button
- Success/error handling

#### 3. Create Ad Push Request Modal
**Location:** `src/containers/merchant/homepage-push/create-ad-request-modal.jsx`

**Features:**
- Upload ad image or video
- Select existing ad from merchant settings
- Ad preview
- Show estimated cost
- Submit button
- Success/error handling

#### 4. Homepage Push Requests List
**Location:** `src/containers/merchant/homepage-push/requests-list.jsx`

**Features:**
- Table/List showing all homepage push requests
- Columns:
  - Type (Coupon/Ad)
  - Preview thumbnail
  - Status with badge
  - Created date
  - Actions (Pay if approved, View details)
- Status badges:
  - Pending Agent Review (yellow)
  - Disapproved by Agent (red)
  - Forwarded to Super Admin (blue)
  - Approved - Payment Required (green + action button)
  - Active on Homepage (green)
  - Rejected (red)
  - Expired (gray)

#### 5. Payment Modal/Page
**Location:** `src/containers/merchant/homepage-push/payment-modal.jsx`

**Features:**
- Show approval details
- Display amount to pay
- Stripe checkout integration
- Payment to agent's Stripe account
- Success redirect
- Error handling for insufficient agent balance

### API Integration Functions

```javascript
// src/lib/services/homepage-push.js

export const createCouponPushRequest = async (couponId) => {
  return await axiosInstance.post('/approvals/homepage-coupon-push', { coupon_id: couponId });
};

export const createAdPushRequest = async (adDetails) => {
  return await axiosInstance.post('/approvals/homepage-ad-push', adDetails);
};

export const getMyHomepagePushRequests = async (merchantId) => {
  return await axiosInstance.get(`/approvals/merchant/${merchantId}`);
};

export const processHomepagePushPayment = async (approvalId, paymentMethodId) => {
  return await axiosInstance.post(`/approvals/${approvalId}/process-payment`, {
    payment_method_id: paymentMethodId,
  });
};

export const getHomepagePushSettings = async () => {
  return await axiosInstance.get('/super-admin-settings');
};
```

---

## 🔧 Phase 6: Frontend - Agent Interface (PENDING)

### Pages/Components to Create

#### 1. Agent Dashboard - Homepage Requests Tab
**Location:** `src/containers/agent/dashboard/homepage-requests-tab.jsx`

**Features:**
- Tab in agent dashboard
- Badge showing pending requests count
- List of pending homepage push requests from merchants

#### 2. Homepage Requests List (Agent View)
**Location:** `src/containers/agent/homepage-push/requests-list.jsx`

**Features:**
- Table showing pending requests
- Columns:
  - Merchant name
  - Type (Coupon/Ad)
  - Preview
  - Request date
  - Actions (Review)
- Filters:
  - All / Pending / Forwarded / Disapproved

#### 3. Review Request Modal
**Location:** `src/containers/agent/homepage-push/review-request-modal.jsx`

**Features:**
- Full request details
- Merchant information
- Coupon/Ad preview
- Large preview of how it will look on homepage
- Cost information
- Two action buttons:
  - Forward to Super Admin (primary)
  - Disapprove (secondary, requires reason)
- Reason textarea for disapproval
- Success/error handling

### API Integration Functions

```javascript
// src/lib/services/agent-homepage-push.js

export const getAgentPendingHomepushRequests = async () => {
  return await axiosInstance.get('/approvals/agent-pending');
};

export const forwardToSuperAdmin = async (approvalId) => {
  return await axiosInstance.patch(`/approvals/${approvalId}/forward-to-superadmin`);
};

export const disapproveByAgent = async (approvalId, reason) => {
  return await axiosInstance.patch(`/approvals/${approvalId}/disapprove-by-agent`, { reason });
};
```

---

## 👑 Phase 7: Frontend - Super Admin Interface (PENDING)

### Pages/Components to Create

#### 1. Super Admin Dashboard - Homepage Requests Tab
**Location:** `src/containers/master-admin/homepage-requests/index.jsx`

**Features:**
- Dedicated section for homepage requests
- Badge showing pending forwarded requests count
- Navigation to full requests management page

#### 2. Homepage Requests Management Page
**Location:** `src/containers/master-admin/homepage-requests/requests-management.jsx`

**Features:**
- Full-page table of forwarded requests
- Columns:
  - Merchant name
  - Agent name
  - Type (Coupon/Ad)
  - Preview
  - Request date
  - Forwarded date
  - Actions (Review, Approve, Reject)
- Filters:
  - Type (All/Coupon/Ad)
  - Status (Pending/Approved/Rejected)
  - Agent (dropdown)
  - Date range
- Available slots indicator at top

#### 3. Review Request Modal (Super Admin)
**Location:** `src/containers/master-admin/homepage-requests/review-modal.jsx`

**Features:**
- Full request details chain:
  - Merchant info
  - Agent who forwarded
  - Request date & forward date
- Large preview of coupon/ad
- Available slots information
- Placement preview (where it will appear)
- Cost information
- Three action buttons:
  - Approve (primary) - immediate
  - Reject (secondary, requires reason)
  - Close/Cancel
- Reason textarea for rejection

#### 4. Active Homepage Placements Page
**Location:** `src/containers/master-admin/homepage-requests/active-placements.jsx`

**Features:**
- Grid view of currently active homepage items
- Separate sections for Coupons and Ads
- Each item shows:
  - Preview
  - Merchant name
  - Placement slot
  - Time remaining until expiry
  - Manual remove button (if needed)
- Visual representation of slot layout

#### 5. Homepage Settings (Part of Super Admin Settings)
**Location:** `src/containers/master-admin/settings/homepage-settings-section.jsx`

**Features:**
- Form section in super admin settings
- Editable fields:
  - Coupon placement cost ($)
  - Ad placement cost ($)
  - Max homepage coupons (1-20)
  - Max homepage ads (1-10)
  - Coupon placement duration (days)
  - Ad placement duration (days)
- Save button
- Validation

### API Integration Functions

```javascript
// src/lib/services/superadmin-homepage-push.js

export const getForwardedHomepushRequests = async () => {
  return await axiosInstance.get('/approvals/superadmin-forwarded');
};

export const approveBySuperAdmin = async (approvalId) => {
  return await axiosInstance.patch(`/approvals/${approvalId}/approve-by-superadmin`);
};

export const rejectBySuperAdmin = async (approvalId, reason) => {
  return await axiosInstance.patch(`/approvals/${approvalId}/reject-by-superadmin`, { reason });
};

export const getActiveHomepagePlacements = async () => {
  return await Promise.all([
    axiosInstance.get('/approvals/homepage-coupons'),
    axiosInstance.get('/approvals/homepage-ads'),
  ]);
};

export const getAvailableHomepageSlots = async () => {
  return await axiosInstance.get('/approvals/available-homepage-slots');
};

export const updateHomepageSettings = async (settings) => {
  return await axiosInstance.patch('/super-admin-settings', settings);
};
```

---

## 🔒 Permission & Role Checks

### Backend Guards

```typescript
// Merchant Endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
POST /approvals/homepage-coupon-push
POST /approvals/homepage-ad-push
POST /approvals/:id/process-payment

// Agent Endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Agent role
GET /approvals/agent-pending
PATCH /approvals/:id/forward-to-superadmin
PATCH /approvals/:id/disapprove-by-agent

// Super Admin Endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super-admin', 'ad-approver')
GET /approvals/superadmin-forwarded
PATCH /approvals/:id/approve-by-superadmin
PATCH /approvals/:id/reject-by-superadmin

// Public Endpoints (No auth required)
GET /approvals/homepage-coupons
GET /approvals/homepage-ads
```

### Frontend Route Protection

```javascript
// Merchant Routes
/merchant/homepage-push/* - Requires 'merchant' role

// Agent Routes
/agent/homepage-requests/* - Requires 'admin' role

// Super Admin Routes
/master-admin/homepage-requests/* - Requires 'super-admin' or 'ad-approver' role
```

---

## 📊 Analytics & Logging

### Events to Track

```typescript
// System Log Events
{
  category: 'HOMEPAGE_PUSH',
  actions: [
    'REQUEST_CREATED',           // Merchant creates request
    'FORWARDED_TO_SUPERADMIN',   // Agent forwards
    'DISAPPROVED_BY_AGENT',      // Agent disapproves
    'APPROVED_BY_SUPERADMIN',    // Super admin approves
    'REJECTED_BY_SUPERADMIN',    // Super admin rejects
    'PAYMENT_COMPLETED',         // Merchant pays successfully
    'PAYMENT_FAILED',            // Payment fails
    'PLACEMENT_ACTIVATED',       // Item goes live on homepage
    'PLACEMENT_EXPIRED',         // Item expires
  ]
}
```

### Wallet Transaction Types

```typescript
{
  type: 'HOMEPAGE_PLACEMENT_DEDUCTION',
  description: 'Homepage coupon/ad placement cost',
  amount: -50.00, // Negative for deduction
  related_entity: 'approval',
  related_entity_id: approvalId,
}
```

---

## 🔍 Testing Checklist

### Phase 1 Testing
- [x] Migrations run successfully
- [x] Database schema updated correctly
- [x] Entity relationships work
- [x] DTOs validate correctly

### Phase 2 Testing (When Implemented)
- [ ] Merchants can create coupon push requests
- [ ] Merchants can create ad push requests
- [ ] Agents can see pending requests
- [ ] Agents can forward to super admin
- [ ] Agents can disapprove with reason
- [ ] Status updates correctly at each step

### Phase 3 Testing (When Implemented)
- [ ] Super admin can see forwarded requests
- [ ] Super admin can approve requests
- [ ] Super admin can reject requests
- [ ] Slot availability checked correctly
- [ ] Cannot approve if slots full
- [ ] Payment integration works
- [ ] Agent wallet deducted correctly
- [ ] Payment fails if insufficient agent balance
- [ ] Expiry dates set correctly

### Phase 4 Testing (When Implemented)
- [ ] Homepage coupons API returns active items
- [ ] Homepage ads API returns active items
- [ ] Expired items don't appear
- [ ] Items sorted by slot/placement correctly

### Phase 5-7 Testing (When Implemented)
- [ ] All frontend forms work
- [ ] Modals open/close correctly
- [ ] API integration successful
- [ ] Error messages display properly
- [ ] Success messages/redirects work
- [ ] Status badges show correctly
- [ ] Filters work
- [ ] Payment flow completes
- [ ] Real-time updates (if implemented)

---

## 🐛 Known Issues / Edge Cases

### Handled
1. ✅ Agent wallet balance check before payment
2. ✅ Slot limit validation
3. ✅ Expiry date calculation
4. ✅ Foreign key cascade on coupon deletion

### To Handle in Later Phases
1. ⏳ What if agent is removed while request is pending?
2. ⏳ What if merchant is deactivated after payment?
3. ⏳ Refund handling if placement removed early
4. ⏳ Concurrent slot requests (race condition)
5. ⏳ Handling failed Stripe payments but wallet already deducted

---

## 📝 Notes & Decisions

### Design Decisions

1. **Separate Duration Fields**: Split into `coupon_homepage_placement_duration_days` and `ad_homepage_placement_duration_days` to allow different durations for coupons vs ads.

2. **Payment Flow**: Payment goes to agent's Stripe first, then cost deducted from agent wallet. This ensures agent receives payment before platform deduction.

3. **Slot Assignment**: Automatic slot assignment (homepage_coupon_slot_1-10, homepage_ad_slot_1-4) to simplify management.

4. **Approval Chain**: Required agent intermediate step prevents spam to super admin and ensures agent oversight of their merchants.

5. **Payment Status Separate**: `payment_status` separate from `approval_status` to track payment state independently.

### Future Enhancements (Not in Current Scope)

- [ ] Featured/premium slots at higher price
- [ ] Bulk discount for multiple placements
- [ ] Analytics dashboard for homepage placement performance
- [ ] Auto-renewal option
- [ ] Notification system for status changes
- [ ] Homepage placement preview before live
- [ ] A/B testing for homepage layouts

---

## 🔗 Related Documentation

- [PREPAID_WALLET_MODEL_IMPLEMENTATION.md](./PREPAID_WALLET_MODEL_IMPLEMENTATION.md) - Wallet system details
- [MILESTONE4_IMPLEMENTATION_SUMMARY.md](./MILESTONE4_IMPLEMENTATION_SUMMARY.md) - Previous milestone
- [Stripe Integration Documentation](./STRIPE_INTEGRATION.md) - Stripe payment details

---

## 📞 Questions & Decisions Log

### February 23, 2026

**Q1:** Should merchants only request existing coupons/ads, or can they create new ones?  
**A1:** Both - merchants can select existing OR create new ones specifically for homepage.

**Q2:** Should agent approval be required before forwarding?  
**A2:** Yes - merchant sends to agent, agent reviews and either forwards to super admin or disapproves.

**Q3:** Should there be limits on homepage slots?  
**A3:** Yes - 10 coupons max, 4 ads max (configurable by super admin).

**Q4:** Should we use existing paid_ad logic or separate?  
**A4:** Separate - different placement slots, different limits, different purpose (homepage vs agent homepage).

**Q5:** Duration fields - one combined or separate?  
**A5:** Separate - `coupon_homepage_placement_duration_days` and `ad_homepage_placement_duration_days` for flexibility.

---

## ✅ Phase 2 Implementation Complete (Feb 23, 2026)

**Files Created:**
- `create-homepage-coupon-request.dto.ts` - Validates coupon_id
- `create-homepage-ad-request.dto.ts` - Validates ad_type
- `disapprove-approval.dto.ts` - Validates rejection reason

**Service Methods Added (approval.service.ts):**
- `createHomepageCouponRequest()` - Merchant creates coupon push (status: pending_agent_review)
- `createHomepageAdRequest()` - Merchant creates ad push (status: pending_agent_review)
- `forwardToSuperAdmin()` - Agent forwards (status: forwarded_to_superadmin)
- `disapproveByAgent()` - Agent rejects (status: disapproved_by_agent)
- `getPendingRequestsForAgent()` - Get agent's pending requests
- `getForwardedRequestsForSuperAdmin()` - Get super admin's forwarded requests

**Controller Endpoints Added (approval.controller.ts):**
- `POST /approvals/homepage-coupon-push` - Merchant creates coupon request
- `POST /approvals/homepage-ad-push` - Merchant creates ad request
- `PATCH /approvals/:id/forward-to-superadmin` - Agent forwards
- `PATCH /approvals/:id/disapprove-by-agent` - Agent disapproves
- `GET /approvals/agent-pending` - Agent views pending
- `GET /approvals/superadmin-forwarded` - Super admin views forwarded

**Key Features:**
- Auto-extracts merchantId/adminId from JWT token
- Validates ownership (agent can only forward their merchants' requests)
- Status validation (only pending can be forwarded/disapproved)
- Relations included (merchant, settings, coupon, admin)

---

**Last Updated:** February 23, 2026  
**Next Phase:** Phase 3 - Super Admin Approval & Payment Processing  
**Status:** Phase 2 Complete - Ready for Phase 3
