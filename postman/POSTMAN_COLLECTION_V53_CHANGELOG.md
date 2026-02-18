# Postman Collection v53 - Changelog

## Overview
**Collection Name**: `53QR Review & Coupon SaaS API - With Credits Ledger`  
**Location**: `/postman/53QR Review & Coupon SaaS API - With Credits Ledger.postman_collection.json`  
**Last Updated**: February 13, 2026

## Recent Updates

### ✨ Wallet Top-Up Feature (Feb 13, 2026)

Added new endpoint for agent wallet top-up with Stripe checkout integration and multi-tier bonus packages.

#### New Endpoint: Top Up Admin Wallet
**Method**: `POST`  
**Path**: `/wallets/admin/:adminId/topup`  
**Auth**: Bearer Token required  
**Location**: Wallets > Admin Wallet > Top Up Admin Wallet

**Request Body:**
```json
{
  "amount": 1050,
  "description": "Standard Top-Up Package - Stripe Checkout",
  "metadata": {
    "packageId": "topup_1000",
    "packageName": "Standard Top-Up",
    "baseAmount": 1000,
    "bonusAmount": 50,
    "stripeSessionId": "cs_test_xxxxxxxxxxxxx"
  }
}
```

**Parameters:**
- `amount` (number, required) - Total amount to credit including bonus
- `description` (string, optional) - Transaction description
- `metadata` (object, optional) - Package details for analytics:
  - `packageId` - Package identifier
  - `packageName` - Display name
  - `baseAmount` - Base payment amount
  - `bonusAmount` - Platform bonus credit
  - `stripeSessionId` - Stripe checkout session ID

**Top-Up Package Tiers:**

| Package | Base Amount | Bonus | Total Credit | Badge |
|---------|-------------|--------|--------------|-------|
| Starter | RM 500 | RM 0 | RM 500 | - |
| Standard | RM 1,000 | RM 50 | RM 1,050 | ⭐ Most Popular |
| Business | RM 2,500 | RM 150 | RM 2,650 | - |
| Professional | RM 5,000 | RM 500 | RM 5,500 | - |
| Enterprise | RM 10,000 | RM 1,500 | RM 11,500 | - |

**Success Response (200):**
```json
{
  "message": "Wallet topped up successfully",
  "data": {
    "id": 123,
    "wallet_id": 45,
    "type": "credit",
    "amount": 1050,
    "balance_before": 500.00,
    "balance_after": 1550.00,
    "description": "Standard Top-Up Package - Stripe Checkout",
    "metadata": {
      "packageId": "topup_1000",
      "packageName": "Standard Top-Up",
      "baseAmount": 1000,
      "bonusAmount": 50
    },
    "created_at": "2026-02-13T10:30:00.000Z"
  }
}
```

**Error Responses:**

Invalid Amount (400):
```json
{
  "statusCode": 400,
  "message": ["amount must not be less than 1", "amount must be a number"],
  "error": "Bad Request"
}
```

Admin Not Found (404):
```json
{
  "statusCode": 404,
  "message": "Admin not found",
  "error": "Not Found"
}
```

**Business Logic:**
- Creates a credit transaction in admin wallet
- Updates wallet balance atomically
- Records metadata for analytics and reconciliation
- Supports bonus incentives (platform gift, not charged)
- Used after successful Stripe checkout completion

**Related Frontend Flow:**
1. Agent selects package from UI (5 visual cards)
2. Completes Stripe checkout (charges base amount only)
3. Frontend calls this endpoint with total (base + bonus)
4. Wallet balance refreshes immediately
5. Success toast displays total credited

### ✨ Agent Stripe API Key Configuration (Feb 16, 2026)

Agents can now configure their own Stripe API keys to receive merchant payments directly to their Stripe accounts.

#### Updated Endpoint: Get Admin by ID
**Method**: `GET`  
**Path**: `/admins/:adminId`  
**Location**: Admins > Get Admin by ID

**Response Enhancement:**
```json
{
  "message": "Success fetching admin",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "has_stripe_key": true,  // ✨ NEW: Indicates if Stripe key is configured
    // ... other fields
  }
}
```

**New Field:**
- `has_stripe_key` (boolean): Indicates whether agent has configured a Stripe API key
- The actual `stripe_secret_key` is **never returned** for security (uses `@Exclude()` decorator)

#### Enhanced Endpoint: Create Admin
**Method**: `POST`  
**Path**: `/admins`  
**Location**: Admins > Create Admin

**Request Body (Enhanced):**
```json
{
  "name": "John Agent",
  "email": "agent1@example.com",
  "password": "password123",
  "phone": "+60123456789",
  "address": "123 Agent Street, KL",
  "city": "Kuala Lumpur",
  "country": "Malaysia",
  "is_active": true,
  "stripe_secret_key": "sk_test_xxxxxxxxxxxxx"  // ✨ OPTIONAL: Configure during creation
}
```

**New Optional Field:**
- `stripe_secret_key`: Agent's Stripe API key can now be configured during account creation
- If not provided, agent can configure it later via update endpoint or settings UI
- Same validation and security rules apply as update endpoint
- Response includes `has_stripe_key` flag
- Key is encrypted and stored securely

**Use Cases:**
- **Bulk agent onboarding:** Configure Stripe keys during initial account creation
- **Self-service:** Admin can add their Stripe key later via settings
- **Security:** Optional field ensures flexibility without forcing immediate configuration

#### Updated Endpoint: Update Admin
**Method**: `PATCH`  
**Path**: `/admins/:adminId`  
**Location**: Admins > Update Admin

**Request Body (Enhanced):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+60123456789",
  "address": "123 Agent St",
  "city": "Kuala Lumpur",
  "country": "Malaysia",
  "is_active": true,
  "stripe_secret_key": "sk_test_xxxxxxxxxxxxx"  // ✨ NEW: Configure Stripe key
}
```

**Stripe Key Configuration:**
- **Set Key:** Provide `stripe_secret_key` with valid Stripe secret key
- **Remove Key:** Set `stripe_secret_key: null`
- **Validation:** Key must start with `sk_test_` or `sk_live_`
- **Security:** Key is encrypted in database, never returned in API responses
- **Response:** Returns `has_stripe_key: true/false` after update

**Frontend Implementation:**
- New **Stripe API** tab in agent settings (`/agent/settings?tab=stripe`)
- Visual connection status indicator
- Masked key display for configured keys
- Input field with show/hide toggle
- Instructions on obtaining Stripe API key
- Payment flow diagram explaining prepaid wallet model
- **Stripe key field in agent creation/update forms** (`/master-admin/agents/create` and `/master-admin/agents/:id/edit`)
  - Optional field during agent creation
  - Can be configured or updated later
  - Show/hide toggle for security
  - Monospaced font for key display
  - Helpful placeholder text with examples

**Business Model:**
1. Agent configures Stripe secret key once
2. Merchant makes payment → 100% goes to agent's Stripe account
3. Platform deducts costs from agent's prepaid wallet
4. Agent keeps profit (merchant payment - platform cost)

**Security Features:**
- Stripe key encrypted at rest
- Uses `@Exclude()` decorator - never exposed in API responses
- Only `has_stripe_key` flag indicates presence
- Frontend never displays actual key after saving
- Key validated on input (must start with sk_test_ or sk_live_)

---

### ✨ SuperAdminSettings - Platform Cost Model (Feb 13, 2026)

Major update from commission-based model to prepaid wallet platform cost model. Agents now maintain prepaid balance and platform deducts costs per operation.

#### Updated Endpoint: Get Platform Cost Settings (Public)
**Method**: `GET`  
**Path**: `/super-admin-settings/platform-cost-settings` (Previously `/commission-settings`)  
**Auth**: None required (public endpoint)  
**Location**: Super Admin Settings > Get Platform Cost Settings (Public)

**Response:**
```json
{
  "merchantAnnualPlatformCost": 299.00,
  "whatsappBIPlatformCost": 0.45,
  "whatsappUIAnnualPlatformCost": 0.12,
  "whatsappUITemporaryPlatformCost": 0.12,
  "couponAnnualPlatformCost": 0.05,
  "couponTemporaryPlatformCost": 0.05,
  "currency": "MYR"
}
```

**Platform Costs:**
- `merchantAnnualPlatformCost` - Deducted when merchant activates annual subscription (default: RM299)
- `whatsappBIPlatformCost` - Deducted per WhatsApp BI message sent (default: RM0.45)
- `whatsappUIAnnualPlatformCost` - Deducted per WhatsApp UI for annual merchants (default: RM0.12)
- `whatsappUITemporaryPlatformCost` - Deducted per WhatsApp UI for temporary merchants (default: RM0.12)
- `couponAnnualPlatformCost` - Deducted per coupon for annual merchants (default: RM0.05)
- `couponTemporaryPlatformCost` - Deducted per coupon for temporary merchants (default: RM0.05)

**Business Model:**
- Merchant payment → 100% to agent's Stripe account
- Platform cost → Automatically deducted from agent's prepaid wallet
- Agent profit = Merchant payment - Platform cost
- Operations blocked if agent has insufficient balance

#### Updated Endpoint: Update Settings
**Method**: `PATCH`  
**Path**: `/super-admin-settings`  
**Auth**: Super Admin only  
**Location**: Super Admin Settings > Update Settings (Super Admin Only)

**Request Body (Updated Fields):**
```json
{
  "admin_annual_subscription_fee": 1499.00,
  "merchant_annual_fee": 1499.00,
  "merchant_annual_platform_cost": 299.00,
  "whatsapp_bi_platform_cost": 0.45,
  "whatsapp_ui_annual_platform_cost": 0.12,
  "whatsapp_ui_temporary_platform_cost": 0.12,
  "coupon_annual_platform_cost": 0.05,
  "coupon_temporary_platform_cost": 0.05,
  "currency": "MYR"
}
```

**Removed Fields (Old Commission Model):**
- ❌ `temporary_merchant_packages_admin_commission_rate`
- ❌ `annual_merchant_packages_admin_commission_rate`
- ❌ `annual_merchant_subscription_admin_commission_rate`

**Added Fields (New Platform Cost Model):**
- ✅ `merchant_annual_platform_cost`
- ✅ `whatsapp_bi_platform_cost`
- ✅ `whatsapp_ui_annual_platform_cost`
- ✅ `whatsapp_ui_temporary_platform_cost`
- ✅ `coupon_annual_platform_cost`
- ✅ `coupon_temporary_platform_cost`

**Field Descriptions:**

**Fees (what customers pay):**
- `admin_annual_subscription_fee` - Agent's annual platform subscription (default: RM1499)
- `merchant_annual_fee` - Merchant's annual subscription fee (default: RM1499)

**Platform Costs (deducted from agent wallet):**
- `merchant_annual_platform_cost` - Platform cost per annual merchant
- `whatsapp_bi_platform_cost` - Platform cost per BI message
- `whatsapp_ui_annual_platform_cost` - Platform cost per UI (annual)
- `whatsapp_ui_temporary_platform_cost` - Platform cost per UI (temporary)
- `coupon_annual_platform_cost` - Platform cost per coupon (annual)
- `coupon_temporary_platform_cost` - Platform cost per coupon (temporary)

#### Updated Merchant Wallet Endpoints

**Add Credits to Merchant Wallet:**  
Description updated to reflect platform cost deduction:
- 100% payment goes to agent's Stripe
- Platform costs deducted from agent's prepaid wallet
- Agent must have sufficient balance

**Upgrade to Annual Subscription:**  
Description updated with platform cost model:
- Merchant pays RM1499 → Agent's Stripe
- Platform deducts RM299 from agent's prepaid wallet
- Agent profit: RM1499 - RM299 = RM1200
- Requires RM299 minimum balance

---

## Existing Endpoints

### Admin Wallet Endpoints
- `GET /wallets/admin/:adminId` - Get admin wallet details
- `GET /wallets/admin/:adminId/transactions` - Get transaction history (paginated)
- `POST /wallets/admin/:adminId/topup` - ✨ NEW: Top up wallet balance

### Merchant Wallet Endpoints  
- `GET /wallets/merchant/:merchantId` - Get merchant wallet details
- `GET /wallets/merchant/:merchantId/transactions` - Get transaction history (paginated)

---

## Testing Guide

### Testing Top-Up Endpoint

1. **Prerequisites:**
   - Valid admin JWT token
   - Admin ID from database
   - Backend running

2. **Test Starter Package (No Bonus):**
```bash
curl -X POST \
  {{base_url}}/wallets/admin/{{admin_id}}/topup \
  -H 'Authorization: Bearer {{access_token}}' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 500,
    "description": "Starter Top-Up Package",
    "metadata": {
      "packageId": "topup_500",
      "packageName": "Starter Top-Up",
      "baseAmount": 500,
      "bonusAmount": 0
    }
  }'
```

3. **Test Standard Package (With Bonus):**
```bash
curl -X POST \
  {{base_url}}/wallets/admin/{{admin_id}}/topup \
  -H 'Authorization: Bearer {{access_token}}' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 1050,
    "description": "Standard Top-Up Package - Stripe Checkout",
    "metadata": {
      "packageId": "topup_1000",
      "packageName": "Standard Top-Up",
      "baseAmount": 1000,
      "bonusAmount": 50,
      "stripeSessionId": "cs_test_a1b2c3d4e5f6"
    }
  }'
```

4. **Verify Results:**
   - Check wallet balance increased by `amount`
   - Verify transaction created with correct metadata
   - Confirm `balance_before` and `balance_after` are accurate
   - Check transaction appears in `GET /wallets/admin/:adminId/transactions`

---

## Variables

Ensure these variables are set in your Postman environment:

```
base_url = http://localhost:3000/api
admin_id = 1
access_token = <your_jwt_token>
```

---

## Support

**Integration with Prepaid Wallet Model:**
- Agents must maintain prepaid balance for operations
- Platform deducts costs automatically when merchants purchase
- Top-up provides self-service balance replenishment
- Bonus incentives encourage larger deposits

**Documentation:**
- See `PREPAID_WALLET_MODEL_IMPLEMENTATION.md` for complete system overview
- Frontend implementation in `qr-review-frontend/qr_tenants/src/containers/agent/wallet/`
- Package configuration in `wallet-topup-packages.js`

**Common Issues:**
- **401 Unauthorized**: Check JWT token is valid and not expired
- **404 Not Found**: Verify admin_id exists in database
- **400 Bad Request**: Validate amount is positive number
- **500 Server Error**: Check database connection and migrations

---

## Migration Notes

No new migrations required - uses existing wallet and transaction tables.

**Database Tables Used:**
- `admin_wallets` - Stores wallet balance and totals
- `wallet_transactions` - Records all credit/debit transactions

**Transaction Type:**
- Type: `credit`
- Category: Wallet top-up (distinguishable by description/metadata)
