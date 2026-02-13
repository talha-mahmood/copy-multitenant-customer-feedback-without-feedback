# Prepaid Wallet Model Implementation

## Overview
Implemented a prepaid wallet deduction system where agents must maintain a prepaid balance. When merchants purchase credit packages, the platform automatically deducts platform costs from the agent's wallet.

**Business Model:**
- Merchant pays 100% to agent's Stripe account
- Platform automatically deducts platform cost from agent's prepaid wallet
- Agent keeps the profit (merchant payment - platform cost)
- Insufficient agent balance blocks purchases/activations

---

## Phase 1: SuperAdminSettings Entity - Platform Costs

### Entity Changes
**File:** `src/modules/super-admin-settings/entities/super-admin-settings.entity.ts`

**Removed Fields (Commission-based model):**
- `temporary_merchant_packages_admin_commission_rate`
- `annual_merchant_packages_admin_commission_rate`
- `annual_merchant_subscription_admin_commission_rate`

**Added Fields (Platform cost model):**
```typescript
@Column({ type: 'decimal', precision: 10, scale: 2, default: 299.00 })
merchant_annual_platform_cost: number;

@Column({ type: 'decimal', precision: 10, scale: 4, default: 0.45 })
whatsapp_bi_platform_cost: number;

@Column({ type: 'decimal', precision: 10, scale: 4, default: 0.12 })
whatsapp_ui_annual_platform_cost: number;

@Column({ type: 'decimal', precision: 10, scale: 4, default: 0.12 })
whatsapp_ui_temporary_platform_cost: number;

@Column({ type: 'decimal', precision: 10, scale: 4, default: 0.05 })
coupon_annual_platform_cost: number;

@Column({ type: 'decimal', precision: 10, scale: 4, default: 0.05 })
coupon_temporary_platform_cost: number;
```

### Migration
**File:** `src/database/migrations/1770500000000-update-super-admin-settings-add-platform-costs.ts`

- Drops 3 old commission rate columns
- Adds 6 new platform cost columns with default values
- Updates existing records to use default values

### DTO Updates
**File:** `src/modules/super-admin-settings/dto/update-settings.dto.ts`

Updated validation decorators for new platform cost fields (removed old commission fields).

### Seeder Updates
**File:** `src/database/seeder/user/user.seeder.ts`

Updated default SuperAdminSettings with platform costs instead of commission rates.

### Service Updates
**File:** `src/modules/super-admin-settings/super-admin-settings.service.ts`

**Updated Methods:**
- `getSettings()`: Creates default settings with new platform cost fields
- `updateSettings()`: Handles updates for new platform cost fields
- `getPlatformCostSettings()`: Replaced `getCommissionSettings()` - returns platform cost configuration

### Controller Updates
**File:** `src/modules/super-admin-settings/super-admin-settings.controller.ts`

**Updated Endpoint:**
- `GET /platform-cost-settings`: Replaced `/commission-settings` endpoint - returns platform cost configuration for agents

---

## Phase 2: Admin Entity - Stripe Integration

### Entity Changes
**File:** `src/modules/admins/entities/admin.entity.ts`

**Added Field:**
```typescript
@Column({ type: 'text', nullable: true })
@Exclude()
stripe_secret_key: string;
```

- Stores agent's Stripe API secret key
- `@Exclude()` decorator prevents exposure in API responses
- Nullable to allow gradual migration

### Migration
**File:** `src/database/migrations/1770500000001-add-stripe-secret-key-to-admins.ts`

Adds `stripe_secret_key` column to `admins` table (text, nullable).

### DTO Updates
**File:** `src/modules/admins/dto/create-admin.dto.ts`

```typescript
@IsOptional()
@IsString()
stripe_secret_key?: string;
```

### Service Updates
**File:** `src/modules/admins/admin.service.ts`

- `create()`: Handles stripe_secret_key in creation
- `update()`: Handles stripe_secret_key in updates

---

## Phase 3: Credit Package Purchase - Prepaid Deduction Logic

### Wallet Service - Major Rewrite
**File:** `src/modules/wallets/wallet.service.ts`

### 1. Platform Cost Calculation Helper

```typescript
private async calculatePlatformCost(
  creditType: string,
  merchantType: string,
  credits: number,
): Promise<number> {
  const settings = await this.superAdminSettingsService.getSettings();
  let costPerCredit = 0;

  if (creditType === 'whatsapp ui message') {
    costPerCredit = merchantType === 'annual'
      ? parseFloat(settings.whatsapp_ui_annual_platform_cost.toString())
      : parseFloat(settings.whatsapp_ui_temporary_platform_cost.toString());
  } else if (creditType === 'whatsapp bi message') {
    costPerCredit = parseFloat(settings.whatsapp_bi_platform_cost.toString());
  } else if (creditType === 'coupon') {
    costPerCredit = merchantType === 'annual'
      ? parseFloat(settings.coupon_annual_platform_cost.toString())
      : parseFloat(settings.coupon_temporary_platform_cost.toString());
  } else if (creditType === 'paid ads') {
    // Agent keeps 100% for paid ads
    return 0;
  }

  return credits * costPerCredit;
}
```

**Logic:**
- Returns per-credit cost based on credit type and merchant type
- Paid ads return 0 (no platform cost)
- Multiplies by credits to get total platform cost

### 2. Updated `addMerchantCredits()` Method

**Key Changes:**

#### A. Calculate Platform Cost
```typescript
const platformCost = await this.calculatePlatformCost(
  creditType,
  merchantType,
  credits,
);
```

#### B. Validate Agent Wallet Balance
```typescript
const currentBalance = parseFloat(adminWallet.balance.toString());
if (currentBalance < platformCost) {
  throw new BadRequestException(
    `Insufficient agent wallet balance. Required: ${platformCost.toFixed(2)}, Available: ${currentBalance.toFixed(2)}. Please top up your wallet to complete this purchase.`
  );
}
```

**Behavior:**
- Blocks purchase if insufficient balance
- Provides clear error message showing required vs available
- Already-purchased credits continue working

#### C. Deduct Platform Cost from Agent Wallet
```typescript
const agentBalanceBefore = parseFloat(adminWallet.balance.toString());
const newAgentBalance = agentBalanceBefore - platformCost;
adminWallet.balance = newAgentBalance;

const agentProfit = amount - platformCost;

agentDeductionTransaction = queryRunner.manager.create(WalletTransaction, {
  admin_wallet_id: adminWallet.id,
  type: 'merchant_package_commission',
  amount: agentProfit,
  status: 'completed',
  description: `Profit from merchant #${merchantId} ${creditType} package purchase (Merchant paid: ${amount.toFixed(2)}, Platform cost: ${platformCost.toFixed(2)})`,
  metadata: JSON.stringify({
    merchant_id: merchantId,
    package_id: creditPackage.id,
    package_name: creditPackage.name,
    credits,
    credit_type: creditType,
    merchant_payment: amount,
    platform_cost_deducted: platformCost,
    agent_profit: agentProfit,
  }),
  balance_before: agentBalanceBefore,
  balance_after: newAgentBalance,
  completed_at: new Date(),
});
```

**Transaction Recording:**
- Type: `merchant_package_commission`
- Amount: Agent profit (merchant payment - platform cost)
- Description: Clear breakdown showing all monetary values
- Metadata: Complete financial details for audit trail

#### D. Credit Super Admin Wallet with Platform Cost
```typescript
const superAdminBalanceBefore = parseFloat(superAdminWallet.balance.toString());
const newSuperAdminBalance = superAdminBalanceBefore + platformCost;
superAdminWallet.balance = newSuperAdminBalance;

await queryRunner.manager.save(WalletTransaction, {
  super_admin_wallet_id: superAdminWallet.id,
  type: 'merchant_package_commission',
  amount: platformCost,
  status: 'completed',
  description: `Platform cost from agent #${adminId} for merchant #${merchantId} ${creditType} purchase`,
  metadata: JSON.stringify({
    merchant_id: merchantId,
    admin_id: adminId,
    package_id: creditPackage.id,
    package_name: creditPackage.name,
    credits,
    credit_type: creditType,
    platform_cost: platformCost,
    merchant_payment: amount,
    agent_profit: amount - platformCost,
  }),
  balance_before: superAdminBalanceBefore,
  balance_after: newSuperAdminBalance,
  completed_at: new Date(),
});
```

**Transaction Recording:**
- Type: `merchant_package_commission`
- Amount: Platform cost (what platform earned)
- Description: Clear reference to source agent and merchant
- Metadata: Complete context including agent profit for reconciliation

---

## Transaction Flow Example

**Scenario:** Merchant purchases 1000 WhatsApp UI message credits (RM120) from annual agent

1. **Platform Cost Calculation:**
   - Credit type: `whatsapp ui message`
   - Merchant type: `annual`
   - Cost per credit: RM0.12
   - Total platform cost: 1000 × 0.12 = **RM120**

2. **Agent Wallet Check:**
   - Current balance: RM500
   - Required: RM120
   - ✅ Sufficient (purchase proceeds)

3. **Merchant Payment:**
   - Merchant pays RM120 to agent's Stripe account
   - Agent receives full RM120 in Stripe

4. **Agent Wallet Deduction:**
   - Balance before: RM500
   - Platform cost deducted: RM120
   - Balance after: RM380
   - **Transaction recorded:**
     - Type: `merchant_package_commission`
     - Amount: RM0 (agent profit = 120 - 120)
     - Description: "Profit from merchant #123 whatsapp ui message package purchase (Merchant paid: 120.00, Platform cost: 120.00)"

5. **Super Admin Wallet Credit:**
   - Balance before: RM10,000
   - Platform cost added: RM120
   - Balance after: RM10,120
   - **Transaction recorded:**
     - Type: `merchant_package_commission`
     - Amount: RM120
     - Description: "Platform cost from agent #45 for merchant #123 whatsapp ui message purchase"

---

## Paid Ads Exception

**Behavior:** Agent keeps 100% of paid ads revenue

```typescript
if (creditType === 'paid ads') {
  return 0; // No platform cost
}
```

- Platform cost calculation returns 0
- No deduction from agent wallet
- Agent retains full amount paid by merchant
- Super admin wallet not credited

---

## Error Handling

### Insufficient Balance Error
```
BadRequestException: 
"Insufficient agent wallet balance. Required: 120.00, Available: 50.00. Please top up your wallet to complete this purchase."
```

**Behavior:**
- Purchase/activation blocked
- Clear error message with required vs available balance
- Agent must top up wallet to proceed
- Already-purchased credits continue working

### Transaction Safety
- Uses TypeORM `queryRunner` for atomic transactions
- Automatic rollback on any error
- Maintains data integrity across all wallet operations

---

## Phase 3 Continued: Annual Merchant Fee Deduction

### Merchant Service - Annual Merchant Creation
**File:** `src/modules/merchants/merchant.service.ts`

### Updated `create()` Method

Replaced commission-based logic with prepaid wallet deduction for annual merchants:

#### A. Platform Cost Configuration
```typescript
const ANNUAL_FEE = parseFloat(settings.merchant_annual_fee.toString());
const PLATFORM_COST = parseFloat(settings.merchant_annual_platform_cost.toString());
const agentRevenue = ANNUAL_FEE; // Agent receives full payment via Stripe
```

#### B. Validate Agent Wallet Balance
```typescript
const currentBalance = parseFloat(adminWallet.balance.toString());
if (currentBalance < PLATFORM_COST) {
  throw new HttpException(
    `Insufficient agent wallet balance. Required: ${PLATFORM_COST.toFixed(2)}, Available: ${currentBalance.toFixed(2)}. Please top up your wallet to create an annual merchant.`,
    400,
  );
}
```

**Behavior:**
- Blocks annual merchant creation if insufficient balance
- Clear error message showing required vs available amount
- Temporary merchants not affected (no platform cost)

#### C. Deduct Platform Cost from Agent Wallet
```typescript
const agentBalanceBefore = currentBalance;
const newAgentBalance = agentBalanceBefore - PLATFORM_COST;
const agentProfit = agentRevenue - PLATFORM_COST;

await queryRunner.manager.update(AdminWallet, adminWallet.id, {
  balance: newAgentBalance,
  total_earnings: parseFloat(adminWallet.total_earnings.toString()) + agentProfit,
});

await queryRunner.manager.save(WalletTransaction, {
  admin_wallet_id: adminWallet.id,
  type: 'merchant_package_commission',
  amount: agentProfit,
  status: 'completed',
  description: `Profit from annual merchant #${savedMerchant.id} creation (Merchant paid: ${ANNUAL_FEE.toFixed(2)}, Platform cost: ${PLATFORM_COST.toFixed(2)})`,
  metadata: JSON.stringify({
    merchant_id: savedMerchant.id,
    merchant_payment: agentRevenue,
    platform_cost_deducted: PLATFORM_COST,
    agent_profit: agentProfit,
    fee_type: 'annual_subscription',
  }),
  balance_before: agentBalanceBefore,
  balance_after: newAgentBalance,
  completed_at: new Date(),
});
```

**Transaction Recording:**
- Type: `merchant_package_commission` (consistent with credit packages)
- Amount: Agent profit (RM299 - RM299 = RM0 in default config)
- Description: Clear breakdown of merchant payment and platform cost
- Metadata: Complete financial context for auditing

#### D. Credit Super Admin Wallet with Platform Cost
```typescript
const superAdminBalanceBefore = parseFloat(superAdminWallet.balance.toString());
const newSuperAdminBalance = superAdminBalanceBefore + PLATFORM_COST;

await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
  balance: newSuperAdminBalance,
  total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + PLATFORM_COST,
  commission_merchant_annual_fee: parseFloat(superAdminWallet.commission_merchant_annual_fee.toString()) + PLATFORM_COST,
});

await queryRunner.manager.save(WalletTransaction, {
  super_admin_wallet_id: superAdminWallet.id,
  type: 'merchant_package_commission',
  amount: PLATFORM_COST,
  status: 'completed',
  description: `Platform cost from agent #${admin_id} for annual merchant #${merchant_id} creation`,
  metadata: JSON.stringify({
    merchant_id: savedMerchant.id,
    admin_id: createMerchantDto.admin_id,
    platform_cost: PLATFORM_COST,
    merchant_payment: agentRevenue,
    agent_profit: agentProfit,
    fee_type: 'annual_subscription',
  }),
  balance_before: superAdminBalanceBefore,
  balance_after: newSuperAdminBalance,
  completed_at: new Date(),
});
```

**Transaction Recording:**
- Type: `merchant_package_commission` (consistent with credit packages)
- Amount: Platform cost (RM299 default)
- Description: References source agent and merchant
- Metadata: Complete context including agent profit for reconciliation

### Annual Merchant Creation Flow Example

**Scenario:** Agent creates annual merchant (RM299 fee)

1. **Platform Cost:**
   - Annual fee: RM299
   - Platform cost: RM299 (default in settings)
   - Agent revenue: RM299 (merchant pays via Stripe)

2. **Agent Wallet Check:**
   - Current balance: RM500
   - Required: RM299
   - ✅ Sufficient (creation proceeds)

3. **Merchant Payment:**
   - Merchant pays RM299 to agent's Stripe account
   - Agent receives full RM299 in Stripe

4. **Agent Wallet Deduction:**
   - Balance before: RM500
   - Platform cost deducted: RM299
   - Balance after: RM201
   - **Transaction:**
     - Type: `merchant_package_commission`
     - Amount: RM0 (agent profit = 299 - 299)
     - Description: "Profit from annual merchant #123 creation (Merchant paid: 299.00, Platform cost: 299.00)"

5. **Super Admin Wallet Credit:**
   - Balance before: RM10,000
   - Platform cost added: RM299
   - Balance after: RM10,299
   - **Transaction:**
     - Type: `merchant_package_commission`
     - Amount: RM299
     - Description: "Platform cost from agent #45 for annual merchant #123 creation"

---

## Phase 3 Extended: Merchant Annual Upgrade

### Wallet Service - Upgrade to Annual Subscription
**File:** `src/modules/wallets/wallet.service.ts`

### Updated `upgradeToAnnual()` Method

When temporary merchant upgrades to annual subscription, agent must have sufficient prepaid balance for platform cost deduction:

#### Key Changes:

```typescript
// Platform cost configuration
const ANNUAL_FEE = parseFloat(settings.merchant_annual_fee.toString());
const PLATFORM_COST = parseFloat(settings.merchant_annual_platform_cost.toString());

// Balance validation
const currentBalance = parseFloat(adminWallet.balance.toString());
if (currentBalance < PLATFORM_COST) {
  throw new BadRequestException(
    `Insufficient agent wallet balance. Required: ${PLATFORM_COST.toFixed(2)}, Available: ${currentBalance.toFixed(2)}. Please top up your wallet to upgrade merchant to annual.`
  );
}

// Deduct from agent, credit super admin (same pattern as merchant creation)
// Returns: { success: true, expires_at, annual_fee, agent_profit, platform_cost }
```

**Transaction Type:** `merchant_package_commission` with `fee_type: 'annual_upgrade'` in metadata

---

## Pending Work

### Frontend Implementation
- Display agent wallet balance in:
  - Credit package purchase UI
  - Annual merchant creation UI
- Show platform cost breakdown before purchase/creation
- Handle insufficient balance errors gracefully with user-friendly messages
- Display transparency of agent profit vs platform cost
- Add wallet top-up flow for agents

### Testing & Validation
- Test annual merchant creation with sufficient/insufficient balance
- Verify prepaid deduction across all credit types
- Validate transaction consistency across agent and super admin wallets
- Test error handling and rollback scenarios

---

## Files Modified Summary

### Phase 1 (SuperAdminSettings):
1. `src/modules/super-admin-settings/entities/super-admin-settings.entity.ts`
2. `src/database/migrations/1770500000000-update-super-admin-settings-add-platform-costs.ts`
3. `src/modules/super-admin-settings/dto/update-settings.dto.ts`
4. `src/database/seeder/user/user.seeder.ts`
5. `src/modules/super-admin-settings/super-admin-settings.service.ts`
6. `src/modules/super-admin-settings/super-admin-settings.controller.ts`

### Phase 2 (Admin Stripe Integration):
1. `src/modules/admins/entities/admin.entity.ts`
2. `src/database/migrations/1770500000001-add-stripe-secret-key-to-admins.ts`
3. `src/modules/admins/dto/create-admin.dto.ts`
4. `src/modules/admins/admin.service.ts`

### Phase 3 (Prepaid Wallet Deduction Logic):
1. `src/modules/wallets/wallet.service.ts` - Credit package purchase & annual upgrade
2. `src/modules/merchants/merchant.service.ts` - Annual merchant creation

---

## Migration Commands

```bash
# Run migrations
npm run migration:run

# Revert if needed
npm run migration:revert
```

---

## Testing Checklist

### Credit Package Purchase:
- [ ] Test credit package purchase with sufficient agent balance
- [ ] Test credit package purchase with insufficient agent balance (should fail with clear error)
- [ ] Verify agent wallet balance deducted correctly
- [ ] Verify super admin wallet credited correctly
- [ ] Verify transaction records created with correct amounts and metadata
- [ ] Test paid ads purchase (no wallet deduction, agent keeps 100%)
- [ ] Test with both annual and temporary merchants
- [ ] Test all credit types (WhatsApp UI/BI, coupons, paid ads)

### Annual Merchant Creation:
- [ ] Test annual merchant creation with sufficient agent balance
- [ ] Test annual merchant creation with insufficient agent balance (should fail with clear error)
- [ ] Verify agent wallet deducted with platform cost (RM299 default)
- [ ] Verify super admin wallet credited with platform cost
- [ ] Verify transaction records created with correct type and amounts
- [ ] Test temporary merchant creation (should not deduct from wallet)
- [ ] Verify merchant wallet and settings created correctly

### Merchant Annual Upgrade:
- [ ] Test temporary to annual upgrade with sufficient agent balance
- [ ] Test temporary to annual upgrade with insufficient agent balance (should fail)
- [ ] Verify agent wallet deducted correctly (RM299 default)
- [ ] Verify super admin wallet credited correctly
- [ ] Verify merchant_type and subscription_type updated to 'annual'
- [ ] Verify subscription_expires_at set to 1 year from upgrade date
- [ ] Test upgrade on already-annual merchant (should fail with clear error)

### General:
- [ ] Verify already-purchased credits work even if wallet insufficient
- [ ] Test transaction rollback on errors (atomicity)
- [ ] Validate balance_before and balance_after tracking accuracy
- [ ] Test with various platform cost configurations in SuperAdminSettings
- [ ] Verify total_earnings updates correctly in both wallets

---

## Notes

- **Zero Debt Risk:** Prepaid model ensures platform always gets paid upfront
- **Strong Cash Flow:** No collection issues or agent defaults
- **Transaction Transparency:** Clear metadata for financial reconciliation
- **Atomicity:** All wallet operations use database transactions for consistency
- **Backward Compatible:** Existing credits continue working; only new purchases require prepaid balance
- **Reporting Compatibility:** Transaction type `merchant_annual_subscription_commission` still referenced in existing reports/analytics for historical data
- **API Endpoint Change:** `/commission-settings` replaced with `/platform-cost-settings` - frontend may need update if using old endpoint
