# Milestone 4 Campaign Features - Implementation Summary

## Overview
This document describes the implementation of three automated Business-Initiated (BI) WhatsApp campaign features for the 37QR SaaS platform:

1. **Inactive Customer Recall** - Automated messages to customers who haven't returned in N days
2. **Festival Broadcasts** - Automated messages for festivals (New Year, Christmas, etc.)
3. **Scheduled Campaigns** - Custom campaigns scheduled for specific dates and target audiences

## Key Features

### 1. Inactive Customer Recall Campaign

**File**: `src/modules/feedbacks/inactive-customer-recall.service.ts`

**Functionality**:
- Runs as a cron job (daily at 10 AM production, every 30 seconds testing)
- Finds customers who haven't submitted feedback in N days (configurable per merchant)
- Only available to **annual merchants** (temporary merchants cannot use BI campaigns)
- Checks WhatsApp BI credits before sending
- Assigns a coupon from the configured batch
- Sends personalized WhatsApp message with coupon
- Prevents duplicate messages (checks if message already sent today)
- Logs all successes and failures to system logs

**Merchant Settings**:
- `inactive_recall_enabled` (boolean) - Enable/disable feature
- `inactive_recall_days` (int) - Days of inactivity threshold (default: 30)
- `inactive_recall_coupon_batch_id` (int) - Coupon batch to use

**Database Migration**: `1769500000000-add-campaign-settings-to-merchant-settings.ts`

### 2. Festival Campaign

**File**: `src/modules/feedbacks/festival-campaign.service.ts`

**Functionality**:
- Runs as a cron job (daily at 8 AM production, every minute testing)
- Automatically detects today's festival (New Year, Valentine's, Chinese New Year, Christmas)
- Sends messages to ALL active customers for enabled merchants
- Only available to **annual merchants**
- Checks WhatsApp BI credits before sending
- Assigns coupons from configured batch
- Prevents duplicate messages (checks if already sent today)
- Logs all successes and failures

**Merchant Settings**:
- `festival_campaign_enabled` (boolean) - Enable/disable feature
- `festival_coupon_batch_id` (int) - Coupon batch to use

**Supported Festivals**:
```typescript
- New Year (January 1)
- Valentine's Day (February 14)
- Chinese New Year (February 10, approximate)
- Christmas (December 25)
```

**Database Migration**: `1769500000000-add-campaign-settings-to-merchant-settings.ts`

### 3. Scheduled Campaigns

**Files**:
- Service: `src/modules/scheduled-campaigns/scheduled-campaign.service.ts`
- Entity: `src/modules/scheduled-campaigns/entities/scheduled-campaign.entity.ts`
- Controller: `src/modules/scheduled-campaigns/scheduled-campaign.controller.ts`
- DTOs: `src/modules/scheduled-campaigns/dto/`

**Functionality**:
- Runs as a cron job (every 5 minutes production, every minute testing)
- Merchants can create custom campaigns with:
  - Custom message (supports `{customer_name}` and `{business_name}` placeholders)
  - Scheduled date/time
  - Target audience (all, active, inactive, first_time, returning)
  - Optional coupon assignment
- Only available to **annual merchants**
- Tracks campaign progress (messages sent, failed)
- Prevents duplicate messages same day
- Campaign statuses: scheduled, processing, completed, cancelled, failed

**Target Audiences**:
- `all` - All customers
- `active` - Customers with feedback in last 30 days
- `inactive` - Customers without feedback in last 90 days
- `first_time` - Customers with only 1 feedback
- `returning` - Customers with more than 1 feedback

**API Endpoints**:
```
POST   /scheduled-campaigns         - Create new campaign
GET    /scheduled-campaigns         - List all campaigns (filtered by merchant/status)
GET    /scheduled-campaigns/:id     - Get campaign details
PUT    /scheduled-campaigns/:id     - Update campaign (only if scheduled)
DELETE /scheduled-campaigns/:id     - Cancel campaign (only if scheduled)
```

**Database Migration**: `1769600000000-create-scheduled-campaigns-table.ts`

## Merchant Type Restrictions

All three campaigns are **Business-Initiated (BI)** messages and therefore:

✅ **Annual Merchants**:
- Can use all campaign features
- Can purchase WhatsApp BI credit packages
- Can configure campaign settings

❌ **Temporary Merchants**:
- CANNOT use any BI campaigns
- CANNOT purchase BI credit packages
- Can only use User-Initiated (UI) messages (feedback, luckydraw)

## Credit Management

All campaigns check WhatsApp BI credits before sending:

```typescript
const creditCheck = await this.walletService.checkMerchantCredits(
  merchant.id,
  'whatsapp_bi',
  1,
);

if (!creditCheck.hasCredits) {
  // Skip message, log warning
  return;
}
```

Credits are deducted via `sendWhatsAppMessageWithCredits()` which:
1. Validates merchant has sufficient BI credits
2. Sends the WhatsApp message
3. Deducts 1 BI credit from merchant wallet
4. Creates transaction record
5. Logs message to whatsapp_messages table

## Duplicate Prevention

All campaigns check for recent messages before sending:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const existingMessage = await this.whatsappService.findRecentMessage(
  merchant.id,
  customer.id,
  WhatsAppCampaignType.INACTIVE_RECALL, // or FESTIVAL, CUSTOM
  today,
);

if (existingMessage) {
  return; // Skip, already sent today
}
```

This prevents:
- Sending duplicate festival messages if cron runs multiple times
- Sending duplicate inactive recall messages
- Sending duplicate scheduled campaign messages

## System Logging

All campaigns log their activities:

**Success Logs**:
- Action: `BI_INACTIVE_RECALL_SENT`, `BI_FESTIVAL_SENT`, `BI_CUSTOM_CAMPAIGN_SENT`
- Level: INFO
- Category: CAMPAIGN
- Includes: merchant_id, customer_id, coupon_code, campaign details

**Failure Logs**:
- Action: `BI_INACTIVE_RECALL_FAILED`, `BI_FESTIVAL_FAILED`, `BI_CUSTOM_CAMPAIGN_FAILED`
- Level: ERROR
- Category: CAMPAIGN
- Includes: merchant_id, customer_id, error message

## Cron Job Schedules

### Development/Testing (Current):
```typescript
// Inactive Recall
@Cron(CronExpression.EVERY_30_SECONDS)

// Festival Campaign
@Cron(CronExpression.EVERY_MINUTE)

// Scheduled Campaigns
@Cron(CronExpression.EVERY_MINUTE)
```

### Production (Recommended):
```typescript
// Inactive Recall - Once daily at 10 AM
@Cron(CronExpression.EVERY_DAY_AT_10AM)

// Festival Campaign - Once daily at 8 AM
@Cron(CronExpression.EVERY_DAY_AT_8AM)

// Scheduled Campaigns - Every 5 minutes
@Cron(CronExpression.EVERY_5_MINUTES)
```

## Configuration Changes

### Merchant Settings Entity
Added 5 new columns to `merchant_settings` table:

```typescript
@Column({ default: false })
inactive_recall_enabled: boolean;

@Column({ default: 30 })
inactive_recall_days: number;

@Column({ nullable: true })
inactive_recall_coupon_batch_id: number;

@Column({ default: false })
festival_campaign_enabled: boolean;

@Column({ nullable: true })
festival_coupon_batch_id: number;
```

### Scheduled Campaigns Table
New table `scheduled_campaigns` with columns:
- Campaign details (name, message, scheduled_date)
- Target audience (enum: all, active, inactive, first_time, returning)
- Status tracking (scheduled, processing, completed, cancelled, failed)
- Progress metrics (total_customers, messages_sent, messages_failed)
- Timestamps (started_at, completed_at)

## Module Registration

### Feedback Module
Updated `feedback.module.ts` to register:
- `InactiveCustomerRecallService`
- `FestivalCampaignService`
- Customer providers (required for campaign processing)

### Scheduled Campaign Module
New module `scheduled-campaign.module.ts`:
- Service with cron job
- Controller with CRUD endpoints
- Providers for scheduled campaigns

### App Module
Added `ScheduledCampaignModule` to modules index and loaded in app.module.ts

## Testing

### Inactive Recall Testing:
1. Enable feature in merchant settings: `inactive_recall_enabled = true`
2. Set low threshold: `inactive_recall_days = 1`
3. Configure coupon batch: `inactive_recall_coupon_batch_id = <batch_id>`
4. Create customer with old feedback (2+ days ago)
5. Wait 30 seconds for cron job
6. Check system logs for BI_INACTIVE_RECALL_SENT

### Festival Testing:
1. Enable feature: `festival_campaign_enabled = true`
2. Configure batch: `festival_coupon_batch_id = <batch_id>`
3. Modify festival date in `festival-campaign.service.ts` to today
4. Wait 1 minute for cron job
5. Check system logs for BI_FESTIVAL_SENT

### Scheduled Campaign Testing:
1. Create campaign via POST `/scheduled-campaigns`:
```json
{
  "merchant_id": 1,
  "campaign_name": "Test Campaign",
  "campaign_message": "Hi {customer_name}, visit {business_name}!",
  "scheduled_date": "2025-01-22T10:00:00Z",
  "target_audience": "all",
  "send_coupons": true,
  "coupon_batch_id": 1
}
```
2. Set scheduled_date to past/current time
3. Wait 1 minute for cron job
4. Check campaign status via GET `/scheduled-campaigns/:id`
5. Verify `status = 'completed'` and `messages_sent > 0`

## Production Checklist

Before deploying to production:

- [ ] Change cron schedules from testing intervals to production intervals
- [ ] Verify all merchants have sufficient WhatsApp BI credits
- [ ] Test all campaigns with real merchant accounts
- [ ] Verify system logs are being written correctly
- [ ] Check duplicate prevention is working (run cron multiple times)
- [ ] Verify temporary merchants cannot access BI campaigns
- [ ] Test scheduled campaign API endpoints with authorization
- [ ] Monitor initial campaign runs for errors
- [ ] Set up alerts for campaign failures (BI_*_FAILED logs)
- [ ] Document campaign settings for merchant dashboard UI

## Next Steps

### Frontend Integration:
1. Add campaign settings UI to merchant dashboard:
   - Toggle for inactive_recall_enabled
   - Input for inactive_recall_days (default 30)
   - Dropdown for inactive_recall_coupon_batch_id
   - Toggle for festival_campaign_enabled
   - Dropdown for festival_coupon_batch_id

2. Add scheduled campaigns UI:
   - Campaign creation form
   - Campaign list with filters (status, date)
   - Campaign details view
   - Cancel campaign button

3. Add campaign analytics:
   - Total campaigns sent
   - Success/failure rates
   - Customer engagement metrics
   - Credit usage by campaign type

### Future Enhancements:
- Add more festivals (Eid, Diwali, etc.) with merchant preferences
- Add A/B testing for campaign messages
- Add campaign performance analytics
- Add customer segment filters (location, age, spending)
- Add campaign templates library
- Add SMS fallback if WhatsApp fails
- Add email campaign option
- Add campaign scheduling with timezone support

## Files Created/Modified

### Created Files:
- `src/modules/feedbacks/inactive-customer-recall.service.ts`
- `src/modules/feedbacks/festival-campaign.service.ts`
- `src/modules/scheduled-campaigns/scheduled-campaign.service.ts`
- `src/modules/scheduled-campaigns/scheduled-campaign.controller.ts`
- `src/modules/scheduled-campaigns/scheduled-campaign.module.ts`
- `src/modules/scheduled-campaigns/scheduled-campaign.provider.ts`
- `src/modules/scheduled-campaigns/entities/scheduled-campaign.entity.ts`
- `src/modules/scheduled-campaigns/dto/create-scheduled-campaign.dto.ts`
- `src/modules/scheduled-campaigns/dto/update-scheduled-campaign.dto.ts`
- `src/database/migrations/1769500000000-add-campaign-settings-to-merchant-settings.ts`
- `src/database/migrations/1769600000000-create-scheduled-campaigns-table.ts`

### Modified Files:
- `src/modules/feedbacks/feedback.module.ts` - Added campaign services
- `src/modules/merchant-settings/entities/merchant-setting.entity.ts` - Added campaign columns
- `src/modules/merchant-settings/dto/create-merchant-setting.dto.ts` - Added campaign fields
- `src/modules/whatsapp/whatsapp.service.ts` - Added findRecentMessage() method
- `src/modules/index.ts` - Exported ScheduledCampaignModule

## Support

For questions or issues:
- Check system logs for campaign failures
- Verify merchant type is 'annual' for BI campaigns
- Ensure WhatsApp BI credits are available
- Check coupon batch is active and has available coupons
- Verify cron jobs are running (check logger output)
