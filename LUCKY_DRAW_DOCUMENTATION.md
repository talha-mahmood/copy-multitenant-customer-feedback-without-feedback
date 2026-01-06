# Lucky Draw System Documentation

## Overview
The Lucky Draw system allows merchants to create engaging prize wheels for their customers. When customers complete certain actions (like submitting feedback), they can spin a lucky draw wheel to win prizes such as coupons, discounts, or free items.

## Key Features
- **Probability-based Prize System**: Each prize has a configurable probability (0-100%)
- **Daily & Total Limits**: Control how many times each prize can be won per day and in total
- **Multiple Prize Types**: Coupon, discount, free item, or no prize
- **Batch Integration**: Link prizes to specific coupon batches
- **Result Tracking**: Track all spins and prize claims
- **Automatic Daily Reset**: Daily prize counts reset automatically

## Database Schema

### lucky_draw_prizes
Stores the prize configuration for each merchant's lucky draw.

| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| merchant_id | int | Foreign key to merchants |
| batch_id | int | Foreign key to coupon_batches (optional) |
| prize_name | varchar(255) | Name of the prize |
| prize_description | text | Detailed description |
| prize_type | varchar(50) | 'coupon', 'discount', 'free_item', 'no_prize' |
| probability | decimal(5,2) | Win probability (0.00-100.00) |
| daily_limit | int | Max wins per day (nullable) |
| total_limit | int | Max total wins (nullable) |
| daily_count | int | Current daily win count |
| total_count | int | Total wins so far |
| is_active | boolean | Whether prize is active |
| sort_order | int | Display order |

### lucky_draw_results
Records every spin result and prize claim.

| Field | Type | Description |
|-------|------|-------------|
| id | int | Primary key |
| customer_id | int | Foreign key to customers |
| merchant_id | int | Foreign key to merchants |
| batch_id | int | Foreign key to coupon_batches |
| prize_id | int | Foreign key to lucky_draw_prizes |
| spin_date | timestamp | When the spin occurred |
| is_claimed | boolean | Whether prize was claimed |
| claimed_at | timestamp | When prize was claimed |

## Business Logic Flow

### 1. Merchant Setup Flow
```
1. Merchant enables lucky_draw on coupon batch
2. Merchant creates prizes for the batch:
   - Set prize name and description
   - Choose prize type (coupon/discount/free_item/no_prize)
   - Configure probability (total of all prizes must = 100%)
   - Set optional daily/total limits
3. System validates probabilities don't exceed 100%
4. Prizes are saved and ready for customer spins
```

### 2. Customer Spin Flow
```
1. Customer completes feedback submission
2. If batch has lucky_draw_enabled:
   a. Frontend calls POST /lucky-draw/spin
   b. System retrieves all active prizes for the batch
   c. System filters out prizes that hit their limits
   d. System normalizes probabilities if some prizes unavailable
   e. Random number generated (0-100)
   f. Prize selected based on cumulative probability
   g. Prize counts incremented (daily_count, total_count)
   h. Result record created in lucky_draw_results
   i. Prize details returned to customer
3. Customer sees winning prize
4. Customer can claim prize (if type = coupon)
```

### 3. Prize Selection Algorithm
```javascript
// Example: 3 prizes with probabilities
Prize A: 50%
Prize B: 30%
Prize C: 20%

// Random number: 0-100
random = 65

// Cumulative probability check:
0-50: Prize A (NO, 65 > 50)
50-80: Prize B (YES, 65 <= 80) ✓
80-100: Prize C

// Prize B is selected
```

### 4. Limit Enforcement
```
Before each spin:
1. Check if prize.total_limit exists
   - If yes, compare prize.total_count >= prize.total_limit
   - If limit reached, exclude prize from selection
   
2. Check if prize.daily_limit exists
   - If yes, compare prize.daily_count >= prize.daily_limit
   - If limit reached, exclude prize from selection

3. If all prizes excluded:
   - Return error: "All prizes have reached their limits"
   
4. If some prizes excluded:
   - Recalculate probabilities among remaining prizes
   - Example: A(50%) excluded, B(30%) + C(20%) remain
   - New probabilities: B(60%), C(40%)
```

## API Endpoints

### Prize Management (Merchant/Admin)

#### POST /lucky-draw/prizes
Create a new prize.

**Auth Required**: Yes (JWT)

**Request Body**:
```json
{
  "merchant_id": 1,
  "batch_id": 5,
  "prize_name": "50% Off Coupon",
  "prize_description": "Get 50% off your next purchase",
  "prize_type": "coupon",
  "probability": 25.00,
  "daily_limit": 10,
  "total_limit": 100,
  "is_active": true,
  "sort_order": 1
}
```

**Response**:
```json
{
  "message": "Lucky draw prize created successfully",
  "data": {
    "id": 1,
    "merchant_id": 1,
    "batch_id": 5,
    "prize_name": "50% Off Coupon",
    "probability": 25.00,
    "daily_count": 0,
    "total_count": 0,
    ...
  }
}
```

**Validation**:
- Total probabilities across all batch prizes must not exceed 100%
- Probability must be 0-100
- prize_type must be: coupon, discount, free_item, or no_prize

---

#### PATCH /lucky-draw/prizes/:id
Update an existing prize.

**Auth Required**: Yes (JWT)

**Request Body**: (all fields optional)
```json
{
  "prize_name": "Updated Prize Name",
  "probability": 30.00,
  "daily_limit": 20,
  "is_active": false
}
```

---

#### GET /lucky-draw/prizes/merchant/:merchantId
Get all prizes for a merchant.

**Auth Required**: No

**Query Parameters**:
- `batchId` (optional): Filter by specific batch

**Response**:
```json
{
  "message": "Prizes retrieved successfully",
  "data": [
    {
      "id": 1,
      "prize_name": "Grand Prize",
      "prize_type": "coupon",
      "probability": 5.00,
      "daily_count": 3,
      "daily_limit": 10,
      "total_count": 45,
      "total_limit": 100,
      ...
    }
  ]
}
```

---

#### DELETE /lucky-draw/prizes/:id
Delete (soft delete) a prize.

**Auth Required**: Yes (JWT)

---

### Customer Interaction

#### POST /lucky-draw/spin
Spin the lucky draw wheel.

**Auth Required**: No (Public)

**Request Body**:
```json
{
  "customer_id": 123,
  "merchant_id": 1,
  "batch_id": 5
}
```

**Response**:
```json
{
  "message": "Lucky draw completed successfully",
  "data": {
    "id": 456,
    "customer_id": 123,
    "merchant_id": 1,
    "batch_id": 5,
    "prize_id": 2,
    "spin_date": "2026-01-06T10:30:00Z",
    "is_claimed": false,
    "prize": {
      "id": 2,
      "prize_name": "Free Coffee",
      "prize_type": "free_item",
      "prize_description": "Enjoy a free coffee on us!"
    }
  }
}
```

**Error Cases**:
- No prizes configured: 400 Bad Request
- All prizes at limit: 400 Bad Request

---

#### GET /lucky-draw/results/customer/:customerId
Get all spin results for a customer.

**Auth Required**: No

**Query Parameters**:
- `merchantId` (optional): Filter by specific merchant

**Response**:
```json
{
  "message": "Results retrieved successfully",
  "data": [
    {
      "id": 456,
      "customer_id": 123,
      "prize": {
        "prize_name": "Free Coffee",
        "prize_type": "free_item"
      },
      "merchant": {
        "id": 1,
        "business_name": "Coffee Shop"
      },
      "spin_date": "2026-01-06T10:30:00Z",
      "is_claimed": true,
      "claimed_at": "2026-01-06T11:00:00Z"
    }
  ]
}
```

---

#### PATCH /lucky-draw/results/:id/claim
Mark a prize as claimed.

**Auth Required**: Yes (JWT)

**Response**:
```json
{
  "message": "Prize claimed successfully",
  "data": {
    "id": 456,
    "is_claimed": true,
    "claimed_at": "2026-01-06T11:00:00Z",
    ...
  }
}
```

---

### Administrative

#### POST /lucky-draw/reset-daily-counts
Reset all daily prize counts (typically called by cron job at midnight).

**Auth Required**: Yes (JWT)

**Response**:
```json
{
  "message": "Daily counts reset successfully"
}
```

## Integration with Feedback Flow

The lucky draw is integrated into the feedback submission process:

```
1. Customer scans merchant QR code
2. Customer fills feedback form (name, phone, DOB)
3. Customer submits review
4. System checks if coupon_batch.lucky_draw_enabled = true
5. If enabled:
   a. Customer sees "Spin the Wheel" option
   b. Customer clicks spin
   c. POST /lucky-draw/spin is called
   d. Customer wins a prize
   e. If prize_type = 'coupon':
      - Coupon is generated from the batch
      - Sent via WhatsApp
   f. Result is recorded
6. If not enabled:
   - Customer receives coupon directly (if configured)
```

## Probability Configuration Examples

### Example 1: Standard Distribution
```
Grand Prize (iPhone): 1% probability, 1 total limit
First Prize (50% off): 10% probability, 20 daily limit
Second Prize (20% off): 20% probability, 50 daily limit
Third Prize (10% off): 30% probability, no limit
Consolation (Thank you): 39% probability, no limit
Total: 100%
```

### Example 2: Guaranteed Win
```
Free Coffee: 30%
10% Discount: 40%
Thank You Message: 30%
Total: 100%
(No "no_prize" option = everyone wins something)
```

### Example 3: With No Prize Option
```
Grand Prize: 5%
Small Prize: 25%
No Prize: 70%
Total: 100%
(Customers might win nothing)
```

## Best Practices

### For Merchants
1. **Balance Probabilities**: Make sure valuable prizes have lower probability
2. **Set Limits**: Protect your business with daily/total limits on expensive prizes
3. **Include Consolation**: Add a "Thank You" or small prize so customers don't feel disappointed
4. **Monitor Counts**: Check prize counts regularly to adjust if needed
5. **Test First**: Create test prizes to verify the system works as expected

### For Developers
1. **Validate Probabilities**: Always check total probability = 100% on prize creation/update
2. **Handle Limit Cases**: Gracefully handle when all prizes hit limits
3. **Reset Daily Counts**: Schedule cron job to run POST /reset-daily-counts at midnight
4. **Transaction Safety**: Prize count updates should be atomic
5. **Audit Trail**: lucky_draw_results provides complete audit history

## Monitoring & Analytics

### Key Metrics to Track
- **Total Spins**: Count of lucky_draw_results
- **Prize Distribution**: Group by prize_id to see which prizes won most
- **Claim Rate**: is_claimed = true / total results
- **Daily Trends**: Spins per day over time
- **Prize Inventory**: Remaining prizes before hitting limits

### SQL Queries

**Total spins per merchant**:
```sql
SELECT merchant_id, COUNT(*) as total_spins
FROM lucky_draw_results
GROUP BY merchant_id;
```

**Prize win distribution**:
```sql
SELECT p.prize_name, COUNT(r.id) as times_won
FROM lucky_draw_results r
JOIN lucky_draw_prizes p ON r.prize_id = p.id
WHERE r.merchant_id = 1
GROUP BY p.prize_name;
```

**Unclaimed prizes**:
```sql
SELECT * FROM lucky_draw_results
WHERE is_claimed = false
AND prize_type = 'coupon'
ORDER BY spin_date DESC;
```

## Troubleshooting

### Issue: "All prizes have reached their limits"
**Cause**: All prizes have hit their daily_limit or total_limit
**Solution**: 
- Increase limits on prizes
- Reset daily counts (if issue is daily limits)
- Add more prizes with higher limits

### Issue: "Total probability exceeds 100%"
**Cause**: Sum of all prize probabilities > 100%
**Solution**:
- Reduce probability of one or more prizes
- Delete unused prizes
- Recalculate probabilities to sum to 100%

### Issue: Same prize wins too often
**Cause**: Probability too high or other prizes disabled
**Solution**:
- Adjust probability to lower value
- Ensure other prizes are active (is_active = true)
- Check if other prizes hit their limits

### Issue: Prize counts not resetting
**Cause**: Cron job not running
**Solution**:
- Verify cron job is scheduled
- Manually call POST /reset-daily-counts
- Check server logs for errors

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on /spin endpoint to prevent abuse
2. **Customer Verification**: Verify customer_id exists before allowing spin
3. **Merchant Authorization**: Only allow merchants to edit their own prizes
4. **Audit Logging**: Log all prize modifications and suspicious activity
5. **Anti-Gaming**: Consider limiting spins per customer per day

## Future Enhancements

- **Scheduled Lucky Draws**: Time-based activation (happy hour only)
- **Customer Segments**: Different prize pools for VIP vs regular customers
- **Prize Tiers**: Unlock better prizes after X visits
- **Social Sharing**: Bonus spins for sharing results on social media
- **Animated Wheel**: Frontend wheel animation matching backend probabilities
- **Prize Images**: Upload images for each prize
- **Win Notifications**: Push notifications when rare prizes won
- **Leaderboard**: Show top winners for gamification

---

## Quick Start Guide

### Setting Up Your First Lucky Draw

1. **Enable Lucky Draw on Batch**:
   ```
   PATCH /coupon-batches/:id
   { "lucky_draw_enabled": true }
   ```

2. **Create 4-5 Prizes**:
   ```
   POST /lucky-draw/prizes
   - Grand Prize: 5%
   - Good Prize: 20%
   - Small Prize: 35%
   - Consolation: 40%
   Total: 100%
   ```

3. **Test Spin**:
   ```
   POST /lucky-draw/spin
   { customer_id, merchant_id, batch_id }
   ```

4. **Monitor Results**:
   ```
   GET /lucky-draw/results/customer/:customerId
   ```

5. **Schedule Daily Reset**:
   ```
   Cron: 0 0 * * * (midnight daily)
   POST /lucky-draw/reset-daily-counts
   ```

You're all set! 🎉
