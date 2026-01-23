# Super Admin Settings Module Migration

## Summary
Created a new `SuperAdminSettingsModule` to manage all commission rates and fees, separating configuration from the wallet entity. This provides better organization and cleaner architecture.

## Changes Made

### 1. New Module Structure
Created `/src/modules/super-admin-settings/` with:
- **Entity**: `SuperAdminSettings` - stores all configuration settings
- **Service**: `SuperAdminSettingsService` - manages settings CRUD operations
- **Controller**: `SuperAdminSettingsController` - exposes REST API endpoints
- **DTO**: `UpdateSuperAdminSettingsDto` - validation for update operations
- **Provider**: `superAdminSettingsProviders` - TypeORM repository injection

### 2. Settings Fields (moved from SuperAdminWallet)
- `admin_subscription_fee` - Fee for admin annual subscription (default: 1199.00)
- `temporary_merchant_commission_rate` - Commission rate for temporary merchants (default: 0.20 = 20%)
- `annual_merchant_commission_rate` - Commission rate for annual merchants (default: 0.02 = 2%)
- `merchant_annual_fee` - Annual subscription fee for merchants (default: 1199.00)
- `admin_annual_commission_rate` - Commission rate admin gets for merchant annual upgrades (default: 0.75 = 75%)
- `currency` - Currency for all fees (default: 'USD')
- `is_active` - Settings active status

### 3. API Endpoints (New Module)

#### Public Endpoints (No Authentication Required)
- **GET** `/super-admin-settings/admin-subscription-fee`
  - Returns: `{ fee: number, currency: string }`
  - Use: Frontend can fetch subscription fee before authentication

- **GET** `/super-admin-settings/commission-settings`
  - Returns: All commission rates and fees with currency
  - Use: Transparent pricing information

#### Super Admin Only Endpoints
- **GET** `/super-admin-settings`
  - Returns: All settings including timestamps
  - Use: View current configuration

- **PATCH** `/super-admin-settings`
  - Body: Any combination of settings fields
  - Returns: Updated settings
  - Use: Modify commission rates and fees

### 4. Database Migrations

#### Migration 1: `1768720000000-create-super-admin-settings-table.ts`
- Creates `super_admin_settings` table with all configuration fields
- Default values match previous wallet defaults
- Includes descriptive comments for each field

#### Migration 2: `1768720000001-remove-commission-fields-from-super-admin-wallet.ts`
- Removes commission/fee fields from `super_admin_wallets` table
- Rollback capability to restore fields if needed

### 5. Updated Files

#### SuperAdminWallet Entity
- Removed 5 commission/fee related columns
- Now focused solely on wallet balance tracking
- Cleaner entity with single responsibility

#### WalletService
- Added `SuperAdminSettingsService` dependency injection
- Updated `createSuperAdminWallet()` - no longer sets commission fields
- Updated `addMerchantCredits()` - fetches rates from settings service
- Updated `upgradeToAnnual()` - fetches fees from settings service
- Updated `processAdminSubscriptionPayment()` - fetches fee from settings service
- Removed methods now in SuperAdminSettingsService:
  - `getAdminSubscriptionFee()`
  - `updateAdminSubscriptionFee()`
  - `getCommissionSettings()`
  - `updateCommissionSettings()`

#### WalletModule
- Imports `SuperAdminSettingsModule`
- Enables dependency injection of settings service

#### WalletController
- Removed endpoints now in SuperAdminSettingsController:
  - `GET /wallets/admin-subscription-fee`
  - `PATCH /wallets/super-admin/subscription-fee`
  - `GET /wallets/commission-settings`
  - `PATCH /wallets/commission-settings`

#### Seeder (user.seeder.ts)
- Imports `SuperAdminSettings` entity
- Creates super admin wallet without commission fields
- Creates super admin settings with default configuration
- Ensures settings exist on first run

#### Module Index (src/modules/index.ts)
- Exports `SuperAdminSettingsModule` for app.module.ts import

## Migration Steps

### 1. Run Migrations
```bash
npm run migration:run
```
This will:
1. Create `super_admin_settings` table
2. Remove commission fields from `super_admin_wallets` table

### 2. Run Seeder (Optional - for new installations)
```bash
npm run seed
```
This creates default settings in the new table.

### 3. Manual Data Migration (If you have existing data)
If you already have a super admin wallet with commission data:

```sql
-- Copy data from super_admin_wallets to super_admin_settings
INSERT INTO super_admin_settings (
  admin_subscription_fee,
  temporary_merchant_commission_rate,
  annual_merchant_commission_rate,
  merchant_annual_fee,
  admin_annual_commission_rate,
  currency,
  is_active,
  created_at,
  updated_at
)
SELECT 
  admin_subscription_fee,
  temporary_merchant_commission_rate,
  annual_merchant_commission_rate,
  merchant_annual_fee,
  admin_annual_commission_rate,
  currency,
  is_active,
  NOW(),
  NOW()
FROM super_admin_wallets
LIMIT 1;
```

## Benefits

### 1. Separation of Concerns
- Wallet entity: Financial transactions and balances
- Settings entity: Configuration and rates

### 2. Better Scalability
- Can add more settings without bloating wallet entity
- Settings can be versioned/historized in future
- Multiple settings profiles possible (future enhancement)

### 3. Cleaner API
- Dedicated endpoints for settings management
- Clear namespace: `/super-admin-settings` vs `/wallets`
- Better documentation organization

### 4. Performance
- Wallet queries lighter (fewer columns)
- Settings cached separately from wallet data
- Reduced data transfer on wallet operations

## Testing Checklist

- [ ] Run migrations successfully
- [ ] Verify `super_admin_settings` table created
- [ ] Verify commission fields removed from `super_admin_wallets`
- [ ] Test GET `/super-admin-settings/admin-subscription-fee` (public)
- [ ] Test GET `/super-admin-settings/commission-settings` (public)
- [ ] Test GET `/super-admin-settings` (super admin auth)
- [ ] Test PATCH `/super-admin-settings` (super admin auth)
- [ ] Test merchant credit purchase uses correct commission rate
- [ ] Test merchant annual upgrade uses correct fee and commission
- [ ] Test admin subscription payment uses correct fee
- [ ] Verify seeder creates settings correctly

## Rollback Plan

If issues arise:

```bash
# Rollback migrations
npm run migration:revert
```

This will:
1. Drop `super_admin_settings` table
2. Restore commission fields to `super_admin_wallets` table

Then restore the old code from git history.

## Future Enhancements

1. **Settings History**
   - Track changes to rates over time
   - Audit trail for compliance

2. **Multi-Currency Support**
   - Different rates per currency
   - Exchange rate management

3. **Settings Versioning**
   - A/B testing different rates
   - Scheduled rate changes

4. **Settings Presets**
   - Save/load configuration profiles
   - Market-specific defaults
