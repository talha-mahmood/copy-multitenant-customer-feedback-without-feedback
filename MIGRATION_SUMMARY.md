# Migration Summary: Moving visibility_logic and placement to coupon_batches

## Overview
This migration moves the `visibility_logic` and `placement` fields from the merchant/merchant-settings tables to the coupon_batches table, where they logically belong since they control batch-level visibility and placement.

---

## Changes Made

### 1. Coupon Batches Module
**Entity (`coupon-batch.entity.ts`):**
- ✅ Added `visibility` (boolean, default: false)
- ✅ Added `placement` (varchar(255), nullable)

**DTO (`create-coupon-batch.dto.ts`):**
- ✅ Added optional `visibility` field
- ✅ Added optional `placement` field

### 2. Merchants Module
**Entity (`merchant.entity.ts`):**
- ❌ Removed `visibility_logic` field
- ❌ Removed `placement` field
- ✅ Kept `paid_ads` field
- ✅ Kept `paid_ad_image` field

### 3. Merchant Settings Module
**Entity (`merchant-setting.entity.ts`):**
- ❌ Removed `visibility_logic` field
- ❌ Removed `placement` field
- ✅ Kept `paid_ads` field
- ✅ Kept `paid_ad_image` field

**DTO (`create-merchant-setting.dto.ts`):**
- ❌ Removed `visibility_logic` field
- ❌ Removed `placement` field
- ✅ Kept `paid_ads` field

**Service (`merchant-setting.service.ts`):**
- ❌ Removed all references to `visibility_logic` and `placement`
- ✅ Simplified update logic to only sync `paid_ads` to merchant table

---

## Database Migrations

### Migration 1: `1767300000000-add_merchant_fields_to_settings.ts`
**Updated to only add:**
- `paid_ads` to merchant_settings
- `paid_ad_image` to merchant_settings

### Migration 2: `1767310000000-add_visibility_to_coupon_batches.ts`
**Renamed and updated to add:**
- `visibility` to coupon_batches
- `placement` to coupon_batches

### Migration 3: `1767320000000-remove_visibility_placement_from_merchants.ts`
**New migration to remove:**
- `visibility_logic` from merchants table
- `placement` from merchants table
- `visibility_logic` from merchant_settings table
- `placement` from merchant_settings table

---

## Migration Order

Run migrations in this order:
```bash
# 1. Add paid_ads fields to merchant_settings
npm run migration:run -- 1767300000000-add_merchant_fields_to_settings

# 2. Add visibility and placement to coupon_batches
npm run migration:run -- 1767310000000-add_visibility_to_coupon_batches

# 3. Remove visibility_logic and placement from merchants and merchant_settings
npm run migration:run -- 1767320000000-remove_visibility_placement_from_merchants
```

Or run all at once:
```bash
npm run migration:run
```

---

## API Changes

### Coupon Batches API
**Create/Update Coupon Batch:**
```json
{
  "merchant_id": 1,
  "batch_name": "Summer Sale",
  "batch_type": "temporary",
  "total_quantity": 100,
  "start_date": "2026-01-10",
  "end_date": "2026-02-10",
  "visibility": true,
  "placement": "homepage_banner"
}
```

### Merchant Settings API
**Update Merchant Settings (removed fields):**
```json
{
  "enable_google_reviews": true,
  "google_review_url": "https://g.page/example",
  "paid_ads": true
}
```

**Note:** `visibility_logic` and `placement` are NO LONGER accepted in merchant settings endpoints.

---

## Benefits of This Change

1. **Better Data Model:** Visibility and placement are batch-specific, not merchant-specific
2. **Flexibility:** Different batches can have different visibility and placement settings
3. **Cleaner Code:** Removes redundant fields from merchant tables
4. **Logical Grouping:** All batch-related settings are now in the coupon_batches table

---

## Rollback

If you need to rollback, run migrations in reverse order:
```bash
npm run migration:revert
```

This will:
1. Add back visibility_logic and placement to merchants/merchant_settings
2. Remove placement from coupon_batches
3. Remove visibility from coupon_batches
4. Remove paid_ads fields from merchant_settings
