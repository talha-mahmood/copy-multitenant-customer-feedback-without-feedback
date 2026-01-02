# Merchant Settings Module Migration

## Overview
Moved all review platform settings from the `merchants` table to a new dedicated `merchant_settings` table for better separation of concerns and cleaner architecture.

## What Changed

### 1. New Module Created: `merchant-settings`
**Location:** `src/modules/merchant-settings/`

**Files Created:**
- `merchant-setting.entity.ts` - Entity for merchant settings with OneToOne relationship to Merchant
- `merchant-setting.service.ts` - Service with CRUD operations + `createDefaultSettings()` helper
- `merchant-setting.controller.ts` - REST API endpoints for settings management
- `merchant-setting.module.ts` - Module configuration
- `merchant-setting.provider.ts` - Repository provider for dependency injection
- `create-merchant-setting.dto.ts` - DTO for creating settings
- `update-merchant-setting.dto.ts` - DTO for updating settings (PartialType)

### 2. Database Migrations
**Location:** `src/database/migrations/`

**Migration Files:**
- `1747650000000-create_merchant_settings_table.ts` - Creates new `merchant_settings` table
- `1747650000001-remove_review_fields_from_merchants.ts` - Removes old review fields from `merchants` table

**merchant_settings table structure:**
```sql
CREATE TABLE merchant_settings (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER UNIQUE NOT NULL REFERENCES merchants(id),
  enable_preset_reviews BOOLEAN DEFAULT true,
  enable_google_reviews BOOLEAN DEFAULT true,
  enable_facebook_reviews BOOLEAN DEFAULT false,
  enable_instagram_reviews BOOLEAN DEFAULT false,
  enable_xiaohongshu_reviews BOOLEAN DEFAULT false,
  google_review_url TEXT,
  facebook_page_url TEXT,
  instagram_url TEXT,
  xiaohongshu_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### 3. Updated Merchant Entity
**File:** `src/modules/merchants/entities/merchant.entity.ts`

**Changes:**
- ✅ Added `@OneToOne` relationship to `MerchantSetting`
- ❌ Removed review platform fields:
  - `enable_preset_reviews`
  - `google_review_url`
  - `facebook_page_url`
  - `instagram_url`
  - `xiaohongshu_url`
  - `enable_google_reviews`
  - `enable_facebook_reviews`
  - `enable_instagram_reviews`
  - `enable_xiaohongshu_reviews`

### 4. Updated Merchant DTO
**File:** `src/modules/merchants/dto/create-merchant.dto.ts`

**Changes:**
- Removed all review platform fields from DTO (now handled by separate settings endpoint)

### 5. Updated Merchant Service
**File:** `src/modules/merchants/merchant.service.ts`

**Changes:**
- Injected `MerchantSettingService`
- Added call to `createDefaultSettings()` in `create()` method after merchant creation
- Default settings: `preset_reviews=true`, `google_reviews=true`, others=false

### 6. Updated Feedback Service
**File:** `src/modules/feedbacks/feedback.service.ts`

**Changes:**
- Injected `MERCHANT_SETTING_REPOSITORY`
- Updated platform validation to fetch from `MerchantSetting` instead of `Merchant`
- Updated `getRedirectUrl()` method to accept `MerchantSetting` parameter

### 7. Updated Modules
**Files Modified:**
- `src/modules/merchants/merchant.module.ts` - Imported `MerchantSettingModule`
- `src/modules/feedbacks/feedback.module.ts` - Added `merchantSettingProviders`
- `src/modules/index.ts` - Exported `MerchantSettingModule`

## API Endpoints

### Merchant Settings Endpoints

#### Create Settings
```http
POST /merchant-settings
Authorization: Bearer <token>

Body:
{
  "merchantId": 1,
  "enablePresetReviews": true,
  "enableGoogleReviews": true,
  "enableFacebookReviews": false,
  "enableInstagramReviews": false,
  "enableXiaohongshuReviews": false,
  "googleReviewUrl": "https://g.page/r/...",
  "facebookPageUrl": "https://facebook.com/...",
  "instagramUrl": "https://instagram.com/...",
  "xiaohongshuUrl": "https://xiaohongshu.com/..."
}
```

#### Get Settings by Merchant ID
```http
GET /merchant-settings/merchant/:merchantId
```

#### Update Settings
```http
PATCH /merchant-settings/merchant/:merchantId
Authorization: Bearer <token>

Body: (all fields optional)
{
  "enableGoogleReviews": true,
  "googleReviewUrl": "https://g.page/r/..."
}
```

#### Delete Settings
```http
DELETE /merchant-settings/merchant/:merchantId
Authorization: Bearer <token>
```

## Migration Steps

### 1. Run Migrations
```bash
npm run migration:run
```

This will:
1. Create the new `merchant_settings` table
2. Remove old review fields from `merchants` table

### 2. Seed Default Settings (Optional)
If you have existing merchants, you may want to create default settings for them:
```bash
# Create a migration/seeder to populate settings for existing merchants
```

### 3. Update Frontend
Update your frontend to:
- Remove review fields from merchant creation form
- Create separate settings management page/form
- Use new `/merchant-settings` endpoints

## Default Settings
When a new merchant is created, default settings are automatically created:
```json
{
  "enable_preset_reviews": true,
  "enable_google_reviews": true,
  "enable_facebook_reviews": false,
  "enable_instagram_reviews": false,
  "enable_xiaohongshu_reviews": false,
  "google_review_url": null,
  "facebook_page_url": null,
  "instagram_url": null,
  "xiaohongshu_url": null
}
```

## Benefits

1. **Separation of Concerns**: Settings are logically separated from core merchant data
2. **Easier to Extend**: Adding new settings doesn't bloat the merchants table
3. **Better API Design**: Dedicated endpoints for settings management
4. **Cleaner Code**: Merchant entity focuses on core business data
5. **Flexibility**: Settings can be updated independently without touching merchant data

## Testing

### Test New Merchant Creation
1. Create a new merchant via `POST /merchants`
2. Verify settings are auto-created: `GET /merchant-settings/merchant/:id`
3. Confirm default values are correct

### Test Settings Update
1. Update settings: `PATCH /merchant-settings/merchant/:id`
2. Verify changes: `GET /merchant-settings/merchant/:id`

### Test Feedback Flow
1. Create feedback with a specific platform
2. Verify platform validation works with new settings table
3. Confirm redirect URL is generated correctly

## Rollback Plan
If needed, you can rollback migrations:
```bash
npm run migration:revert
```

Run this twice to revert both migrations.

## Notes
- Settings have soft delete enabled (`deleted_at` column)
- Unique constraint on `merchant_id` ensures one setting record per merchant
- All write operations require JWT authentication
- GET operations are public for frontend feedback forms
