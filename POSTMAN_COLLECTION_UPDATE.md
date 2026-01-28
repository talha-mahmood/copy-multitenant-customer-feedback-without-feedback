# Postman Collection Update - Campaign Features

## Overview
Updated Postman collection from v38 to v39 with all new campaign management endpoints and updated merchant settings.

**Collection Name**: `39QR Review & Coupon SaaS API - With Campaigns`
**Location**: `/postman/39QR Review & Coupon SaaS API - With Campaigns.postman_collection.json`

## What's New

### 1. Updated Merchant Settings
**Endpoint**: `PATCH /merchant-settings/merchant/:merchant_id`

Added new campaign configuration fields to the request body:

```json
{
  // ... existing fields ...
  
  // Inactive Customer Recall Campaign
  "inactive_recall_enabled": true,
  "inactive_recall_days": 30,
  "inactive_recall_coupon_batch_id": 2,
  
  // Festival Campaign
  "festival_campaign_enabled": true,
  "festival_coupon_batch_id": 3
}
```

**Campaign Settings**:
- `inactive_recall_enabled` (boolean) - Enable/disable inactive customer recall
- `inactive_recall_days` (integer) - Days of inactivity before sending recall (default: 30)
- `inactive_recall_coupon_batch_id` (integer) - Coupon batch for recall messages
- `festival_campaign_enabled` (boolean) - Enable/disable festival broadcasts
- `festival_coupon_batch_id` (integer) - Coupon batch for festival messages

### 2. New Scheduled Campaigns Section

Complete CRUD operations for managing scheduled campaigns:

#### Create Scheduled Campaign
**Endpoint**: `POST /scheduled-campaigns`
**Auth**: Bearer Token (Annual merchants only)

```json
{
  "merchant_id": 1,
  "campaign_name": "Grand Opening Special",
  "campaign_message": "Hi {customer_name}, we're excited to invite you to our grand opening at {business_name}! Don't miss out on exclusive offers!",
  "scheduled_date": "2026-02-01T10:00:00Z",
  "target_audience": "all",
  "send_coupons": true,
  "coupon_batch_id": 1
}
```

**Message Placeholders**:
- `{customer_name}` - Replaced with customer's name
- `{business_name}` - Replaced with merchant's business name

**Target Audience Options**:
- `all` - All customers
- `active` - Customers with feedback in last 30 days
- `inactive` - Customers without feedback in last 90 days
- `first_time` - Customers with only 1 feedback
- `returning` - Customers with more than 1 feedback

**Response**:
```json
{
  "success": true,
  "message": "Campaign scheduled successfully",
  "data": {
    "id": 1,
    "merchant_id": 1,
    "campaign_name": "Grand Opening Special",
    "scheduled_date": "2026-02-01T10:00:00Z",
    "status": "scheduled",
    "target_audience": "all",
    "send_coupons": true,
    "total_customers": 0,
    "messages_sent": 0,
    "messages_failed": 0,
    "created_at": "2026-01-28T10:00:00Z"
  }
}
```

#### Get All Campaigns
**Endpoint**: `GET /scheduled-campaigns`
**Auth**: Bearer Token

**Query Parameters**:
- `merchant_id` (optional) - Filter by merchant ID
- `status` (optional) - Filter by status: scheduled, processing, completed, cancelled, failed

**Example**:
```
GET /scheduled-campaigns?merchant_id=1&status=scheduled
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "merchant_id": 1,
      "campaign_name": "Grand Opening Special",
      "scheduled_date": "2026-02-01T10:00:00Z",
      "status": "scheduled",
      "target_audience": "all",
      "total_customers": 0,
      "messages_sent": 0,
      "messages_failed": 0,
      "send_coupons": true,
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

#### Get Campaign by ID
**Endpoint**: `GET /scheduled-campaigns/:id`
**Auth**: Bearer Token

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "merchant_id": 1,
    "campaign_name": "Grand Opening Special",
    "campaign_message": "Hi {customer_name}...",
    "scheduled_date": "2026-02-01T10:00:00Z",
    "status": "scheduled",
    "target_audience": "all",
    "send_coupons": true,
    "coupon_batch_id": 1,
    "total_customers": 0,
    "messages_sent": 0,
    "messages_failed": 0,
    "merchant": { ... },
    "coupon_batch": { ... }
  }
}
```

#### Update Campaign
**Endpoint**: `PUT /scheduled-campaigns/:id`
**Auth**: Bearer Token
**Note**: Only campaigns with status "scheduled" can be updated

```json
{
  "campaign_name": "Updated Campaign Name",
  "campaign_message": "Updated message for {customer_name} from {business_name}",
  "scheduled_date": "2026-02-15T14:00:00Z",
  "target_audience": "active",
  "send_coupons": true,
  "coupon_batch_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": { ... }
}
```

#### Cancel Campaign
**Endpoint**: `DELETE /scheduled-campaigns/:id`
**Auth**: Bearer Token
**Note**: Only campaigns with status "scheduled" can be cancelled

**Response**:
```json
{
  "success": true,
  "message": "Campaign cancelled successfully"
}
```

#### Get Completed Campaigns
**Endpoint**: `GET /scheduled-campaigns?status=completed`
**Auth**: Bearer Token

**Response**: Shows campaigns with execution statistics
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "campaign_name": "Grand Opening Special",
      "status": "completed",
      "total_customers": 150,
      "messages_sent": 145,
      "messages_failed": 5,
      "started_at": "2026-02-01T10:00:00Z",
      "completed_at": "2026-02-01T10:15:00Z"
    }
  ]
}
```

## Collection Variables

Added new variable:
- `campaign_id` - Stores the ID of the created campaign for use in subsequent requests

**All Variables**:
- `base_url` - API base URL (default: http://localhost:8000/api/v1)
- `jwt_token` - Authentication token (set automatically on login)
- `admin_id` - Admin ID
- `merchant_id` - Merchant ID
- `batch_id` - Coupon batch ID
- `customer_id` - Customer ID
- `campaign_id` - **NEW** - Campaign ID

## Campaign Status Flow

```
scheduled → processing → completed
    ↓
cancelled (only from scheduled)
    ↓
failed (if error occurs)
```

**Status Descriptions**:
- `scheduled` - Campaign is scheduled, waiting for execution time
- `processing` - Campaign is currently being executed
- `completed` - Campaign finished successfully
- `cancelled` - Campaign was cancelled by user (only possible before execution)
- `failed` - Campaign execution failed (insufficient credits, errors, etc.)

## Authorization & Restrictions

### Annual Merchants Only
All campaign features (inactive recall, festival, scheduled) are **only available to annual merchants**.

**Temporary merchants**:
- ❌ Cannot create scheduled campaigns
- ❌ Cannot enable inactive recall
- ❌ Cannot enable festival campaigns
- ❌ Cannot purchase WhatsApp BI credit packages

### Merchant Authorization
- Merchants can only view/edit their own campaigns
- Super admins can view/edit all campaigns
- Attempting to access another merchant's campaign returns 403 Forbidden

## Testing Workflow

### 1. Enable Campaign Settings
```bash
# Update merchant settings to enable campaigns
PATCH /merchant-settings/merchant/1
{
  "inactive_recall_enabled": true,
  "inactive_recall_days": 30,
  "inactive_recall_coupon_batch_id": 2,
  "festival_campaign_enabled": true,
  "festival_coupon_batch_id": 3
}
```

### 2. Create a Test Campaign
```bash
# Create campaign for tomorrow
POST /scheduled-campaigns
{
  "merchant_id": 1,
  "campaign_name": "Test Campaign",
  "campaign_message": "Hi {customer_name}, visit {business_name}!",
  "scheduled_date": "2026-01-29T10:00:00Z",
  "target_audience": "all",
  "send_coupons": true,
  "coupon_batch_id": 1
}
```

### 3. Check Campaign Status
```bash
# Get campaign details
GET /scheduled-campaigns/1

# List all scheduled campaigns
GET /scheduled-campaigns?status=scheduled

# List completed campaigns
GET /scheduled-campaigns?status=completed
```

### 4. Update Campaign (if needed)
```bash
# Update before execution
PUT /scheduled-campaigns/1
{
  "scheduled_date": "2026-01-30T14:00:00Z",
  "target_audience": "active"
}
```

### 5. Cancel Campaign (if needed)
```bash
# Cancel before execution
DELETE /scheduled-campaigns/1
```

## Automated Campaigns (Background)

These campaigns run automatically via cron jobs (not triggered via API):

### Inactive Customer Recall
- **Frequency**: Daily at 10 AM (production)
- **Trigger**: Automatic based on `inactive_recall_enabled` setting
- **Target**: Customers who haven't returned in N days
- **Configuration**: Via merchant settings

### Festival Broadcasts
- **Frequency**: Daily at 8 AM (production)
- **Trigger**: Automatic on festival dates
- **Target**: All customers of enabled merchants
- **Festivals**: New Year, Valentine's, Chinese New Year, Christmas
- **Configuration**: Via merchant settings

## Error Responses

### Insufficient Credits
```json
{
  "success": false,
  "message": "Merchant has insufficient WhatsApp BI credits for scheduled campaign"
}
```

### Temporary Merchant Attempt
```json
{
  "success": false,
  "message": "Only annual merchants can create scheduled campaigns",
  "statusCode": 403
}
```

### Campaign Already Processing
```json
{
  "success": false,
  "message": "Cannot update campaign that is processing or completed",
  "statusCode": 400
}
```

### Unauthorized Access
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 403
}
```

## Important Notes

1. **Annual Merchants Only**: All BI campaigns require annual merchant subscription
2. **Credit Check**: System checks WhatsApp BI credits before sending each message
3. **Duplicate Prevention**: Won't send same campaign to customer twice in one day
4. **Cron Execution**: Scheduled campaigns run every 5 minutes (production)
5. **Message Placeholders**: Always use `{customer_name}` and `{business_name}` in messages
6. **Status Updates**: Campaign status updates automatically as cron job processes
7. **Statistics**: Track messages sent/failed in real-time during execution

## Migration Required

Before using these endpoints, ensure migrations are run:
```bash
npm run migration:run
```

This will create:
- Campaign settings columns in `merchant_settings` table
- New `scheduled_campaigns` table

## Support

For issues or questions:
- Check merchant type is 'annual'
- Verify WhatsApp BI credits are available
- Ensure coupon batch exists and is active
- Check system logs for campaign failures
- Verify scheduled_date is in the future (for new campaigns)
