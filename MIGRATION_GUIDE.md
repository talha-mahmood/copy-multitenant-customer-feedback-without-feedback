# Migration Guide: Moving visibility_logic and placement to coupon_batches

## Current Database State

Your database currently has:
- ✅ `merchants` table with `visibility_logic`, `placement`, `paid_ads`, `paid_ad_image` columns
- ❓ `merchant_settings` table (may or may not have `visibility_logic` and `placement`)
- ✅ `coupon_batches` table (needs `visibility` and `placement` columns)

## Migration Strategy

We need to:
1. Add `visibility` and `placement` to `coupon_batches` table
2. Remove `visibility_logic` and `placement` from `merchants` table
3. Remove `visibility_logic` and `placement` from `merchant_settings` table (if they exist)
4. Keep `paid_ads` and `paid_ad_image` in both `merchants` and `merchant_settings` tables

## Step-by-Step Instructions

### Step 1: Check Current Migration Status

```bash
npm run migration:show
```

This will show you which migrations have already run.

### Step 2: Run Pending Migrations

```bash
npm run migration:run
```

This will run all pending migrations in order:

1. **1767300000000-add_merchant_fields_to_settings.ts**
   - Adds `paid_ads` and `paid_ad_image` to `merchant_settings` table

2. **1767310000000-add_visibility_to_coupon_batches.ts**
   - Adds `visibility` and `placement` to `coupon_batches` table

3. **1767320000000-remove_visibility_placement_from_merchants.ts**
   - Removes `visibility_logic` and `placement` from `merchants` table
   - Removes `visibility_logic` and `placement` from `merchant_settings` table (if they exist)
   - Uses safe checks to avoid errors if columns don't exist

### Step 3: Verify Migration Success

After running migrations, verify the changes:

```sql
-- Check merchants table (should NOT have visibility_logic and placement)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'merchants';

-- Check merchant_settings table (should NOT have visibility_logic and placement)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'merchant_settings';

-- Check coupon_batches table (should HAVE visibility and placement)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'coupon_batches';
```

## Expected Final Schema

### merchants table
- ✅ `paid_ads` (boolean)
- ✅ `paid_ad_image` (text)
- ❌ `visibility_logic` (REMOVED)
- ❌ `placement` (REMOVED)

### merchant_settings table
- ✅ `paid_ads` (boolean)
- ✅ `paid_ad_image` (text)
- ❌ `visibility_logic` (REMOVED)
- ❌ `placement` (REMOVED)

### coupon_batches table
- ✅ `visibility` (boolean, default: false) - NEW
- ✅ `placement` (varchar(255), nullable) - NEW

## Troubleshooting

### Error: Column already exists
If you get an error that a column already exists, it means a migration was partially run. You can:

1. Check which migrations have run:
   ```bash
   npm run migration:show
   ```

2. Manually revert the last migration:
   ```bash
   npm run migration:revert
   ```

3. Then run migrations again:
   ```bash
   npm run migration:run
   ```

### Error: Column does not exist
This is now handled! The migration checks if columns exist before trying to drop them.

### Starting Fresh (Development Only)
If you're in development and want to start fresh:

```bash
# Drop all tables and re-run all migrations
npm run schema:drop
npm run migration:run
```

**⚠️ WARNING: This will delete ALL data!**

## Rollback Instructions

If you need to rollback these changes:

```bash
# Revert last migration
npm run migration:revert

# Revert multiple migrations
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

This will:
1. Add back `visibility_logic` and `placement` to merchants and merchant_settings
2. Remove `placement` from coupon_batches
3. Remove `visibility` from coupon_batches
4. Remove `paid_ads` and `paid_ad_image` from merchant_settings

## Post-Migration Testing

After running migrations, test the following:

### 1. Create Coupon Batch with new fields
```bash
POST /coupon-batches
{
  "merchant_id": 1,
  "batch_name": "Test Batch",
  "batch_type": "temporary",
  "total_quantity": 10,
  "start_date": "2026-01-10",
  "end_date": "2026-02-10",
  "visibility": true,
  "placement": "homepage"
}
```

### 2. Update Merchant Settings (should NOT accept visibility_logic or placement)
```bash
PATCH /merchant-settings/merchant/1
{
  "paid_ads": true,
  "enable_google_reviews": true
}
```

### 3. Verify old fields are rejected
```bash
PATCH /merchant-settings/merchant/1
{
  "visibility_logic": 1,  // Should be ignored or cause validation error
  "placement": "top"      // Should be ignored or cause validation error
}
```

## Summary

After successful migration:
- ✅ Coupon batches can have individual visibility and placement settings
- ✅ Merchant settings are cleaner without redundant fields
- ✅ Data model is more logical and flexible
- ✅ No data loss (only schema changes)
