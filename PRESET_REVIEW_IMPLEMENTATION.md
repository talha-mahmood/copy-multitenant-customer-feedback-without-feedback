# Preset Review & Custom Review Implementation

## Overview
Implemented the preset review or custom review functionality for the feedback system as specified in Milestone 3.

## What Was Implemented

### 1. Database Schema
- **preset_reviews table**: Stores preset review sentences
  - Supports both system-wide defaults (10 preset reviews)
  - Merchant-specific custom preset reviews
  - Display order and active/inactive status
  
- **feedbacks table updates**: Added new columns
  - `review_type`: 'preset' or 'custom'
  - `preset_review_id`: Link to selected preset review
  - `selected_platform`: 'google', 'facebook', 'instagram', 'xiaohongshu'
  - `redirect_completed`: Track if user completed the redirect
  - `review_text`: Store the actual review text used

- **merchants table updates**: Added review platform settings
  - `enable_preset_reviews`: Allow merchant to enable/disable presets
  - Platform URLs: `google_review_url`, `facebook_page_url`, `instagram_url`, `xiaohongshu_url`
  - Platform toggles: `enable_google_reviews`, `enable_facebook_reviews`, etc.

### 2. Entities Created/Updated
- ✅ PresetReview entity
- ✅ Feedback entity (updated with review fields)
- ✅ Merchant entity (updated with platform settings)

### 3. Services Implemented
- **PresetReviewService**:
  - Create/update/delete preset reviews
  - Find all presets (system defaults + merchant custom)
  - Seed 10 system default reviews
  
- **FeedbackService** (enhanced):
  - Validate selected platform is enabled by merchant
  - Validate preset review selection
  - Store review text (preset or custom)
  - Generate platform-specific redirect URLs
  - Track redirect completion
  - Review analytics (preset vs custom, platform stats, completion rate)

### 4. Controllers & Routes
**PresetReviewController** (`/preset-reviews`):
- `GET /preset-reviews?merchantId=X&includeSystemDefaults=true` - Get available presets
- `GET /preset-reviews/seed-defaults` - Seed 10 default reviews
- `POST /preset-reviews` - Create merchant custom preset
- `PATCH /preset-reviews/:id` - Update merchant preset
- `DELETE /preset-reviews/:id` - Delete merchant preset

**FeedbackController** (enhanced):
- `POST /feedbacks` - Create feedback with review (updated)
- `PATCH /feedbacks/:id/complete-redirect` - Mark redirect as completed
- `GET /feedbacks/analytics/:merchantId` - Get review analytics

### 5. DTOs Updated
- **CreateFeedbackDto**: Added review fields
  - `reviewType`: 'preset' | 'custom'
  - `presetReviewId`: Optional (required if preset)
  - `customReviewText`: Optional (required if custom)
  - `selectedPlatform`: 'google' | 'facebook' | 'instagram' | 'xiaohongshu'
  - `redirectCompleted`: Boolean

### 6. Migrations Created
- `1747600000000-create_preset_reviews_table.ts`
- `1747600000001-update_feedbacks_add_review_fields.ts`
- `1747600000002-update_merchants_add_review_settings.ts`

### 7. Seeder
- Created `seed-preset-reviews.ts` with 10 default review sentences
- Integrated into main seed.ts

## How It Works

### Customer Flow
1. Customer scans merchant QR code
2. Fills in name, phone, date of birth
3. Selects review type:
   - **Preset**: Chooses from available preset sentences (system + merchant custom)
   - **Custom**: Writes their own review text
4. Selects a platform (Google/Facebook/Instagram/XiaoHongShu)
   - Only enabled platforms are shown
5. System validates:
   - Platform is enabled by merchant
   - Preset review is valid (if applicable)
   - Review text exists
6. Feedback is created with review data
7. System returns redirect URL for selected platform
8. Customer is redirected to post review
9. (Optional) Frontend can call `/complete-redirect` endpoint when redirect completes

### Merchant Configuration
Merchants can:
- Enable/disable preset reviews
- Create custom preset reviews specific to their business
- Configure which platforms are available
- Set platform-specific URLs for review redirects
- View analytics:
  - Total preset vs custom reviews
  - Reviews per platform
  - Redirect completion rate

## API Examples

### 1. Get Available Preset Reviews
```http
GET /preset-reviews?merchantId=1&includeSystemDefaults=true
```
Returns system defaults + merchant custom presets

### 2. Create Feedback with Preset Review
```http
POST /feedbacks
{
  "merchantId": 1,
  "email": "customer@example.com",
  "password": "password123",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "date_of_birth": "15-05-1990",
  "rating": 5,
  "reviewType": "preset",
  "presetReviewId": 3,
  "selectedPlatform": "google"
}
```

### 3. Create Feedback with Custom Review
```http
POST /feedbacks
{
  "merchantId": 1,
  "email": "customer@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "phoneNumber": "+1234567890",
  "date_of_birth": "20-08-1992",
  "rating": 5,
  "reviewType": "custom",
  "customReviewText": "Amazing food and great atmosphere!",
  "selectedPlatform": "facebook"
}
```

### 4. Get Review Analytics
```http
GET /feedbacks/analytics/1
```
Returns:
- Total reviews
- Preset vs custom breakdown
- Platform statistics
- Redirect completion rate

## Database Migration Instructions

Run migrations in order:
```bash
npm run migration:run
```

Then seed default preset reviews:
```bash
npm run seed
```

Or call the seed endpoint:
```http
GET /preset-reviews/seed-defaults
```

## Next Steps for Frontend Integration

1. **Get Available Platforms**: Query merchant settings to show only enabled platforms
2. **Get Preset Reviews**: Fetch system + merchant presets when "Preset Review" is selected
3. **Submit Feedback**: Send complete payload with review type, text, and platform
4. **Handle Redirect**: Use returned `redirectUrl` to send customer to review platform
5. **Track Completion**: Call `/complete-redirect` endpoint after redirect (optional)
6. **Merchant Dashboard**: Display review analytics

## Files Created
- `src/modules/feedbacks/entities/preset-review.entity.ts`
- `src/modules/feedbacks/preset-review.service.ts`
- `src/modules/feedbacks/preset-review.controller.ts`
- `src/modules/feedbacks/preset-review.provider.ts`
- `src/modules/feedbacks/dto/create-preset-review.dto.ts`
- `src/modules/feedbacks/dto/update-preset-review.dto.ts`
- `src/database/migrations/1747600000000-create_preset_reviews_table.ts`
- `src/database/migrations/1747600000001-update_feedbacks_add_review_fields.ts`
- `src/database/migrations/1747600000002-update_merchants_add_review_settings.ts`
- `src/database/seeder/seed-preset-reviews.ts`

## Files Modified
- `src/modules/feedbacks/entities/feedback.entity.ts`
- `src/modules/feedbacks/feedback.service.ts`
- `src/modules/feedbacks/feedback.controller.ts`
- `src/modules/feedbacks/feedback.module.ts`
- `src/modules/feedbacks/dto/create-feedback.dto.ts`
- `src/modules/merchants/entities/merchant.entity.ts`
- `src/database/seeder/seed.ts`
