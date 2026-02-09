# Super Admin Wallet Commission Tracking Implementation

## Overview
Added four new fields to the Super Admin wallet to track different sources of revenue and commissions separately, providing better financial transparency and reporting capabilities.

---

## New Fields Added

### 1. `revenue_admin_annual_subscription_fee`
**Type:** `decimal(10,2)`  
**Default:** `0`  
**Description:** Tracks total revenue earned from agent/admin annual subscription fees.

**Updated When:** Agent pays their annual subscription fee to the platform.

**Flow:**
```
Agent Annual Subscription Payment
↓
$1,199 charged to agent
↓
Super Admin Wallet: revenue_admin_annual_subscription_fee += $1,199
```

---

### 2. `commission_temporary_merchant_packages`
**Type:** `decimal(10,2)`  
**Default:** `0`  
**Description:** Tracks commission earned from temporary merchant credit package purchases.

**Updated When:** Temporary merchant purchases a credit package (coupons, WhatsApp UI messages, paid ads).

**Flow:**
```
Temporary Merchant Buys Package
↓
Package Price: $100
Commission Rate: 2% (configurable in settings)
↓
Agent Commission: $2 (goes to agent wallet)
Platform Commission: $98
↓
Super Admin Wallet: commission_temporary_merchant_packages += $98
```

---

### 3. `commission_annual_merchant_packages`
**Type:** `decimal(10,2)`  
**Default:** `0`  
**Description:** Tracks commission earned from annual merchant credit package purchases.

**Updated When:** Annual merchant purchases a credit package (coupons, WhatsApp UI/BI messages, paid ads).

**Flow:**
```
Annual Merchant Buys Package
↓
Package Price: $500
Commission Rate: 2% (configurable in settings)
↓
Agent Commission: $10 (goes to agent wallet)
Platform Commission: $490
↓
Super Admin Wallet: commission_annual_merchant_packages += $490
```

---

### 4. `commission_merchant_annual_fee`
**Type:** `decimal(10,2)`  
**Default:** `0`  
**Description:** Tracks commission earned from merchant annual subscription fees (when merchants upgrade from temporary to annual or register as annual).

**Updated When:**
- Merchant upgrades from temporary to annual subscription
- New merchant registers directly as annual merchant

**Flow:**
```
Merchant Upgrades to Annual or Registers as Annual
↓
Annual Fee: $1,499 (configurable in settings)
Commission Rate: 25% to platform, 75% to agent (configurable)
↓
Agent Commission: $1,124.25 (goes to agent wallet)
Platform Commission: $374.75
↓
Super Admin Wallet: commission_merchant_annual_fee += $374.75
```

---

## Database Migration

**Migration File:** `1748500000000-add_commission_fields_to_super_admin_wallet.ts`

**Columns Added:**
- `revenue_admin_annual_subscription_fee` DECIMAL(10,2) DEFAULT 0
- `commission_temporary_merchant_packages` DECIMAL(10,2) DEFAULT 0
- `commission_annual_merchant_packages` DECIMAL(10,2) DEFAULT 0
- `commission_merchant_annual_fee` DECIMAL(10,2) DEFAULT 0

**To Run Migration:**
```bash
npm run migration:run
```

---

## Code Changes

### 1. Entity Update
**File:** `/src/modules/wallets/entities/super-admin-wallet.entity.ts`
- Added 4 new columns with decimal type
- All default to 0
- All track cumulative totals (never decrease)

### 2. Agent Subscription Payment Flow
**File:** `/src/modules/wallets/wallet.service.ts`
**Method:** `processAdminSubscriptionPayment()`
- When agent pays annual subscription
- Updates `revenue_admin_annual_subscription_fee` field
- Full amount goes to super admin (no split)

### 3. Merchant Package Purchase Flow
**File:** `/src/modules/wallets/wallet.service.ts`
**Method:** `purchaseMerchantCredits()`
- Detects if merchant is temporary or annual
- Updates `commission_temporary_merchant_packages` for temporary merchants
- Updates `commission_annual_merchant_packages` for annual merchants
- Platform gets remainder after agent commission

### 4. Merchant Annual Subscription Flow (Upgrade)
**File:** `/src/modules/wallets/wallet.service.ts`
**Method:** `upgradeToAnnual()`
- When merchant upgrades from temporary to annual
- Updates `commission_merchant_annual_fee` field
- Platform gets configured % (default 25%)

### 5. Merchant Annual Subscription Flow (Registration)
**File:** `/src/modules/merchants/merchant.service.ts`
**Method:** `create()`
- When new merchant registers as annual
- Updates `commission_merchant_annual_fee` field
- Same commission split as upgrade flow

---

## API Response

### Get Super Admin Wallet
**Endpoint:** `GET /api/v1/wallets/super-admin`

**Response:**
```json
{
  "id": 1,
  "super_admin_id": 1,
  "balance": 15234.50,
  "total_earnings": 45678.90,
  "total_spent": 30444.40,
  "pending_amount": 0.00,
  "revenue_admin_annual_subscription_fee": 12000.00,
  "commission_temporary_merchant_packages": 5000.00,
  "commission_annual_merchant_packages": 18000.00,
  "commission_merchant_annual_fee": 10678.90,
  "currency": "USD",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-02-09T12:30:00.000Z"
}
```

---

## Financial Reporting Benefits

### Revenue Breakdown by Source
You can now see exactly how much revenue comes from each source:
- **Agent Subscriptions:** Direct revenue from agents paying annual fees
- **Temporary Merchant Packages:** Commission from temporary merchant package sales
- **Annual Merchant Packages:** Commission from annual merchant package sales
- **Merchant Subscriptions:** Commission from merchant annual fee payments

### Example Dashboard Metrics
```
Total Revenue: $45,678.90

Revenue Sources:
├─ Agent Subscriptions: $12,000.00 (26.3%)
├─ Temporary Merchant Packages: $5,000.00 (10.9%)
├─ Annual Merchant Packages: $18,000.00 (39.4%)
└─ Merchant Annual Fees: $10,678.90 (23.4%)
```

---

## Commission Rate Configuration

All commission rates are configurable in Super Admin Settings:

### Agent Subscription Fee
- **Field:** `admin_annual_subscription_fee`
- **Default:** $1,199.00
- **Goes To:** 100% Super Admin

### Temporary Merchant Package Commission
- **Field:** `temporary_merchant_packages_admin_commission_rate`
- **Default:** 2% (0.02)
- **Split:** 2% to Agent, 98% to Super Admin

### Annual Merchant Package Commission
- **Field:** `annual_merchant_packages_admin_commission_rate`
- **Default:** 2% (0.02)
- **Split:** 2% to Agent, 98% to Super Admin

### Merchant Annual Fee Commission
- **Field:** `annual_merchant_subscription_admin_commission_rate`
- **Default:** 75% (0.75) to Agent
- **Split:** 75% to Agent, 25% to Super Admin

**Update Settings:**
```http
PATCH /api/v1/super-admin-settings
Content-Type: application/json

{
  "admin_annual_subscription_fee": 1199.00,
  "temporary_merchant_packages_admin_commission_rate": 0.02,
  "annual_merchant_packages_admin_commission_rate": 0.02,
  "annual_merchant_subscription_admin_commission_rate": 0.75
}
```

---

## Testing Scenarios

### Test 1: Agent Annual Subscription
```bash
# Agent pays annual subscription
POST /api/v1/wallets/process-agent-subscription
Authorization: Bearer <AGENT_TOKEN>

# Check super admin wallet
GET /api/v1/wallets/super-admin

# Verify: revenue_admin_annual_subscription_fee increased by $1,199
```

### Test 2: Temporary Merchant Buys Package
```bash
# Temporary merchant purchases package
POST /api/v1/wallets/purchase
Authorization: Bearer <TEMP_MERCHANT_TOKEN>
{
  "packageId": 1,
  "merchantId": 5
}

# Check super admin wallet
GET /api/v1/wallets/super-admin

# Verify: commission_temporary_merchant_packages increased
# Amount = (package_price * (1 - 0.02))
```

### Test 3: Annual Merchant Buys Package
```bash
# Annual merchant purchases package
POST /api/v1/wallets/purchase
Authorization: Bearer <ANNUAL_MERCHANT_TOKEN>
{
  "packageId": 2,
  "merchantId": 10
}

# Check super admin wallet
GET /api/v1/wallets/super-admin

# Verify: commission_annual_merchant_packages increased
# Amount = (package_price * (1 - 0.02))
```

### Test 4: Merchant Upgrades to Annual
```bash
# Merchant upgrades to annual
POST /api/v1/wallets/upgrade-to-annual/:merchantId
Authorization: Bearer <AGENT_TOKEN>

# Check super admin wallet
GET /api/v1/wallets/super-admin

# Verify: commission_merchant_annual_fee increased by 25% of $1,499
# Amount = $1,499 * 0.25 = $374.75
```

### Test 5: New Annual Merchant Registration
```bash
# Register new annual merchant
POST /api/v1/merchants
{
  "business_name": "Test Business",
  "merchant_type": "annual",
  "admin_id": 2,
  ...
}

# Check super admin wallet
GET /api/v1/wallets/super-admin

# Verify: commission_merchant_annual_fee increased by $374.75
```

---

## Verification Queries

### Check Total Revenue Matches
```sql
SELECT 
  balance,
  total_earnings,
  revenue_admin_annual_subscription_fee +
  commission_temporary_merchant_packages +
  commission_annual_merchant_packages +
  commission_merchant_annual_fee as calculated_earnings
FROM super_admin_wallets
WHERE id = 1;

-- calculated_earnings should equal total_earnings (or very close, accounting for other income sources)
```

### Monthly Revenue Breakdown
```sql
SELECT 
  DATE_TRUNC('month', wt.created_at) as month,
  SUM(CASE WHEN wt.type = 'agent_subscription_fee' THEN wt.amount ELSE 0 END) as agent_subscriptions,
  SUM(CASE WHEN wt.type = 'merchant_package_commission' 
       AND wt.metadata->>'merchant_type' = 'temporary' THEN wt.amount ELSE 0 END) as temp_merchant_packages,
  SUM(CASE WHEN wt.type = 'merchant_package_commission' 
       AND wt.metadata->>'merchant_type' = 'annual' THEN wt.amount ELSE 0 END) as annual_merchant_packages,
  SUM(CASE WHEN wt.type = 'merchant_annual_subscription_commission' THEN wt.amount ELSE 0 END) as merchant_annual_fees
FROM wallet_transactions wt
WHERE wt.super_admin_wallet_id IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

---

## Summary

✅ **Added 4 new tracking fields** to Super Admin Wallet  
✅ **Updated all revenue flows** to populate these fields  
✅ **Created database migration** to add columns  
✅ **Backward compatible** - existing wallets will have 0 for new fields  
✅ **Better financial visibility** - can now see revenue by source  
✅ **Ready for reporting** - can build dashboards showing revenue breakdown  

All commission tracking is automatic - no manual intervention needed. Fields are updated in real-time as transactions occur.
