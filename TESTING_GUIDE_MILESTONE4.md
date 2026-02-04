# Milestone 4 - Testing Guide
## Credits Ledger & Monthly PDF Statements

This guide provides step-by-step testing procedures to verify the complete integration of Credits Ledger and Monthly Statements features.

---

## 🎯 Testing Overview

### What We're Testing:
1. **Credits Ledger** - Bank-style accounting for all credit movements
2. **Monthly Statements** - Auto-generated PDF reports with reconciliation
3. **WhatsApp Integration** - Ledger tracking for UI/BI message credits
4. **Expiry Refunds** - Automatic refund of unused coupon credits

### Prerequisites:
- ✅ Backend server running (`npm run start:dev`)
- ✅ Database migrated and seeded
- ✅ Postman collection imported
- ✅ Test merchant account with credits
- ✅ JWT token obtained from login

---

## Test Suite 1: Credit Purchase → Ledger Entry

### Objective:
Verify that purchasing credits creates a ledger entry with correct details.

### Steps:

#### 1.1 Check Current Balance
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "owner_type": "merchant",
  "owner_id": 5,
  "balances": {
    "coupon": 50,
    "wa_ui": 100,
    "wa_bi": 20,
    "paid_ads": 30
  },
  "last_updated": "2026-01-29T10:00:00.000Z"
}
```

**Note:** Record the opening balances for later verification.

---

#### 1.2 Purchase Credits (Stripe Payment)
```http
POST /api/v1/wallets/merchant/purchase-credits
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "package_id": 5,
  "payment_method_id": "pm_test_123456"
}
```

**Expected Response:**
```json
{
  "message": "Credits purchased successfully",
  "data": {
    "transaction_id": 123,
    "credits_added": 100,
    "new_balance": 150
  }
}
```

---

#### 1.3 Verify Ledger Entry Created
```http
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&action=purchase&limit=1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 45,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "coupon",
      "action": "purchase",
      "amount": 100,
      "balance_before": 50,
      "balance_after": 150,
      "related_object_type": "wallet_transaction",
      "related_object_id": 123,
      "description": "Purchased 100 coupon credits via Stripe payment",
      "metadata": {
        "payment_id": "pi_123456",
        "package_id": 5
      },
      "created_at": "2026-01-30T10:15:00.000Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ action = 'purchase'
- ✅ amount = 100 (positive number)
- ✅ balance_before = 50 (previous balance)
- ✅ balance_after = 150 (new balance)
- ✅ related_object_type = 'wallet_transaction'
- ✅ description includes "Purchased" and credit amount

---

## Test Suite 2: Coupon Batch Generation → Ledger Deduction

### Objective:
Verify that generating a coupon batch deducts credits and creates a ledger entry.

### Steps:

#### 2.1 Check Current Coupon Credits
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Note:** Record coupon credits (should be 150 from previous test).

---

#### 2.2 Generate Coupon Batch
```http
POST /api/v1/coupon-batches
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "batch_name": "Test Batch - January 2026",
  "total_quantity": 20,
  "start_date": "2026-01-30",
  "end_date": "2026-02-28",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_purchase": 50,
  "max_discount": 20,
  "description": "Test batch for ledger verification"
}
```

**Expected Response:**
```json
{
  "message": "Coupon batch created successfully",
  "data": {
    "batch_id": 45,
    "batch_name": "Test Batch - January 2026",
    "total_quantity": 20,
    "credits_deducted": 20,
    "remaining_credits": 130
  }
}
```

---

#### 2.3 Verify Ledger Deduction Entry
```http
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&action=deduct&credit_type=coupon&limit=1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 46,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "coupon",
      "action": "deduct",
      "amount": -20,
      "balance_before": 150,
      "balance_after": 130,
      "related_object_type": "coupon_batch",
      "related_object_id": 45,
      "description": "Deducted 20 coupon credits for batch 'Test Batch - January 2026'",
      "metadata": {
        "batch_id": 45,
        "batch_name": "Test Batch - January 2026",
        "total_quantity": 20
      },
      "created_at": "2026-01-30T10:20:00.000Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ action = 'deduct'
- ✅ amount = -20 (negative number)
- ✅ balance_before = 150
- ✅ balance_after = 130
- ✅ related_object_type = 'coupon_batch'
- ✅ related_object_id matches batch_id
- ✅ description includes batch name

---

## Test Suite 3: WhatsApp UI Message → Ledger Tracking

### Objective:
Verify that sending a user-initiated WhatsApp message deducts wa_ui credits and creates a ledger entry.

### Steps:

#### 3.1 Check Current WhatsApp UI Credits
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Note:** Record wa_ui credits.

---

#### 3.2 Trigger User-Initiated Message (Feedback Submission)
```http
POST /api/v1/feedbacks
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "merchant_id": {{merchant_id}},
  "name": "Test Customer",
  "email": "test@example.com",
  "phone": "+60123456789",
  "rating": 5,
  "feedback_text": "Excellent service!",
  "issue_type": "general_feedback",
  "send_whatsapp": true
}
```

**Expected Response:**
```json
{
  "message": "Feedback submitted successfully",
  "data": {
    "feedback_id": 123,
    "coupon_sent": true,
    "whatsapp_sent": true
  }
}
```

---

#### 3.3 Verify WhatsApp UI Ledger Entry
```http
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&credit_type=wa_ui&action=deduct&limit=1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 47,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "wa_ui",
      "action": "deduct",
      "amount": -1,
      "balance_before": 100,
      "balance_after": 99,
      "related_object_type": "whatsapp_message",
      "related_object_id": 567,
      "description": "WhatsApp UI message sent",
      "metadata": {
        "message_type": "UI",
        "credits_deducted": 1
      },
      "created_at": "2026-01-30T10:25:00.000Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ credit_type = 'wa_ui'
- ✅ action = 'deduct'
- ✅ amount = -1
- ✅ balance_after = balance_before - 1
- ✅ related_object_type = 'whatsapp_message'

---

## Test Suite 4: WhatsApp BI Message → Ledger Tracking

### Objective:
Verify that sending a business-initiated WhatsApp message deducts wa_bi credits and creates a ledger entry.

### Steps:

#### 4.1 Check Current WhatsApp BI Credits
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Note:** Record wa_bi credits.

---

#### 4.2 Trigger Business-Initiated Message (Manual Birthday Campaign)

First, create a customer with upcoming birthday:
```http
POST /api/v1/customers
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "name": "Birthday Test Customer",
  "email": "birthday@example.com",
  "phone": "+60123456788",
  "date_of_birth": "1990-01-31",
  "merchant_id": {{merchant_id}}
}
```

Then trigger birthday message manually:
```http
POST /api/v1/birthday-campaigns/send-manual
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "customer_id": {{customer_id}},
  "merchant_id": {{merchant_id}}
}
```

**Expected Response:**
```json
{
  "message": "Birthday message sent successfully",
  "data": {
    "customer_id": 789,
    "whatsapp_sent": true,
    "coupon_sent": true
  }
}
```

---

#### 4.3 Verify WhatsApp BI Ledger Entry
```http
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&credit_type=wa_bi&action=deduct&limit=1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 48,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "wa_bi",
      "action": "deduct",
      "amount": -1,
      "balance_before": 20,
      "balance_after": 19,
      "related_object_type": "whatsapp_message",
      "related_object_id": 568,
      "description": "WhatsApp BI message sent",
      "metadata": {
        "message_type": "BI",
        "credits_deducted": 1
      },
      "created_at": "2026-01-30T10:30:00.000Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ credit_type = 'wa_bi'
- ✅ action = 'deduct'
- ✅ amount = -1
- ✅ balance_after = balance_before - 1
- ✅ related_object_type = 'whatsapp_message'

---

## Test Suite 5: Coupon Expiry Refund → Ledger Tracking

### Objective:
Verify that expired coupon batches with untaken coupons trigger automatic refunds and create ledger entries.

### Steps:

#### 5.1 Create Batch with Past End Date

First, temporarily disable the date validation or use database insert:
```sql
-- Insert expired batch directly via database
INSERT INTO coupon_batches (
  merchant_id, batch_name, total_quantity, 
  start_date, end_date, discount_type, 
  discount_value, is_active
) VALUES (
  5, 'Expired Test Batch', 10,
  '2026-01-01', '2026-01-20', 'percentage',
  10, true
);

-- Get the batch ID
SELECT id FROM coupon_batches WHERE batch_name = 'Expired Test Batch';

-- Create 10 coupons with status='created' (not taken)
INSERT INTO coupons (
  batch_id, merchant_id, coupon_code, 
  discount_type, discount_value, status
)
SELECT 
  <batch_id>, 5, CONCAT('EXPIRED', LPAD(generate_series::text, 3, '0')),
  'percentage', 10, 'created'
FROM generate_series(1, 10);
```

---

#### 5.2 Record Current Coupon Credits Before Refund
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Note:** Record current coupon credits (should be 130 from earlier tests).

---

#### 5.3 Manually Trigger Expiry Cron Job

Run the cron service manually via terminal:
```bash
# In your backend directory
npm run console

# In the NestJS console
> const app = await NestFactory.createApplicationContext(AppModule);
> const cronService = app.get(CouponExpiryCronService);
> await cronService.processExpiredBatches();
```

**Expected Console Output:**
```
Starting expired batch processing...
Found 1 expired batches to process
Batch 45: Refunded 10 credits to merchant 5
Expired batch processing completed
```

---

#### 5.4 Verify Refund Ledger Entry
```http
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&action=refund&limit=1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 49,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "coupon",
      "action": "refund",
      "amount": 10,
      "balance_before": 130,
      "balance_after": 140,
      "related_object_type": "coupon_batch",
      "related_object_id": 45,
      "description": "Refunded 10 coupon credits from expired batch 'Expired Test Batch'",
      "metadata": {
        "batch_id": 45,
        "batch_name": "Expired Test Batch",
        "total_coupons": 10,
        "untaken_coupons": 10,
        "refunded_credits": 10
      },
      "created_at": "2026-01-30T10:35:00.000Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ action = 'refund'
- ✅ amount = 10 (positive number)
- ✅ balance_after = balance_before + 10
- ✅ related_object_type = 'coupon_batch'
- ✅ description includes "Refunded" and batch name
- ✅ metadata includes untaken_coupons count

---

#### 5.5 Verify Batch Marked Inactive
```http
GET /api/v1/coupon-batches/{{batch_id}}
Authorization: Bearer {{jwt_token}}
```

**Verification:**
- ✅ is_active = false
- ✅ All coupons with status='created' are now status='expired'

---

## Test Suite 6: Monthly Statement Generation

### Objective:
Verify that monthly statements generate correctly with accurate data reconciliation.

### Steps:

#### 6.1 Generate Statement for Current Merchant
```http
POST /api/v1/monthly-statements/generate
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "year": 2026,
  "month": 1,
  "owner_type": "merchant",
  "owner_id": {{merchant_id}}
}
```

**Expected Response:**
```json
{
  "message": "Statement generated successfully",
  "data": {
    "id": 15,
    "owner_type": "merchant",
    "owner_id": 5,
    "company_name": "ABC Restaurant Sdn Bhd",
    "year": 2026,
    "month": 1,
    "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
    "status": "generated"
  }
}
```

---

#### 6.2 Get Statement Details
```http
GET /api/v1/monthly-statements/{{statement_id}}
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "id": 15,
  "owner_type": "merchant",
  "owner_id": 5,
  "company_name": "ABC Restaurant Sdn Bhd",
  "year": 2026,
  "month": 1,
  "statement_data": {
    "period": "January 2026",
    "merchant_name": "ABC Restaurant",
    "coupons": {
      "generated": 20,
      "taken": 15,
      "redeemed": 10,
      "expired": 0
    },
    "whatsapp": {
      "ui_messages": 1,
      "bi_messages": 1,
      "ui_success": 1,
      "bi_success": 1,
      "ui_failed": 0,
      "bi_failed": 0
    },
    "credits": {
      "opening_balance": {
        "coupon": 50,
        "wa_ui": 100,
        "wa_bi": 20,
        "paid_ads": 30
      },
      "closing_balance": {
        "coupon": 140,
        "wa_ui": 99,
        "wa_bi": 19,
        "paid_ads": 30
      },
      "purchased": {
        "coupon": 100,
        "wa_ui": 0,
        "wa_bi": 0,
        "paid_ads": 0
      },
      "used": {
        "coupon": 20,
        "wa_ui": 1,
        "wa_bi": 1,
        "paid_ads": 0
      },
      "refunded": {
        "coupon": 10,
        "wa_ui": 0,
        "wa_bi": 0,
        "paid_ads": 0
      }
    }
  },
  "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
  "status": "generated"
}
```

---

#### 6.3 Verify Balance Reconciliation

**Calculate Expected Closing Balance:**
```
Closing = Opening + Purchased - Used + Refunded

Coupon: 50 + 100 - 20 + 10 = 140 ✅
WA_UI:  100 + 0 - 1 + 0 = 99 ✅
WA_BI:  20 + 0 - 1 + 0 = 19 ✅
```

**Cross-check with Ledger:**
```http
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
Authorization: Bearer {{jwt_token}}
```

**Verification:**
- ✅ Ledger balances match statement closing_balance
- ✅ Statement opening_balance matches ledger balance at month start
- ✅ Statement calculations are correct

---

#### 6.4 Download PDF Statement
```http
GET /api/v1/monthly-statements/{{statement_id}}/download
Authorization: Bearer {{jwt_token}}
```

**Expected:**
- ✅ PDF file downloads successfully
- ✅ PDF contains company name in header
- ✅ PDF includes all sections (coupons, WhatsApp, credits)
- ✅ PDF shows correct period (January 2026)

---

## Test Suite 7: Automated Cron Jobs

### Objective:
Verify that automated cron jobs run correctly.

### Steps:

#### 7.1 Test Monthly Statement Auto-Generation

**Schedule:** 1st of month at 1:00 AM

**Verification:**
```bash
# Check cron service logs
pm2 logs your-app-name | grep "Monthly statements"

# Or check database for new statements
psql -d your_database -c "
  SELECT id, owner_type, owner_id, year, month, created_at 
  FROM monthly_statements 
  WHERE created_at >= NOW() - INTERVAL '1 day'
  ORDER BY created_at DESC;
"
```

**Expected Output:**
```
Statements generated for:
- All merchants: X statements
- All agents: Y statements
- Master platform: 1 statement
```

---

#### 7.2 Test Coupon Expiry Refund Cron

**Schedule:** Daily at 2:00 AM

**Verification:**
```bash
# Check cron service logs
pm2 logs your-app-name | grep "expired batch"

# Check for refund ledger entries
psql -d your_database -c "
  SELECT COUNT(*) as refund_count, SUM(amount) as total_refunded
  FROM credits_ledger 
  WHERE action = 'refund' 
  AND created_at >= NOW() - INTERVAL '1 day';
"
```

---

## 📊 Final Integration Test

### Complete End-to-End Flow

1. **Start Fresh:**
   - Reset merchant wallet to 0 credits
   - Clear all ledger entries for this merchant

2. **Purchase Credits:**
   - Buy 200 coupon credits
   - Buy 300 wa_ui credits
   - Buy 100 wa_bi credits

3. **Use Credits:**
   - Generate 50 coupon batch
   - Send 10 UI messages (feedbacks)
   - Send 5 BI messages (birthday)

4. **Expire & Refund:**
   - Create expired batch with 20 untaken coupons
   - Run expiry cron
   - Verify 20 credits refunded

5. **Generate Statement:**
   - Generate monthly statement
   - Download PDF
   - Verify all numbers match

6. **Final Verification:**
```
Opening Balance: 0
+ Purchased: 200
- Used: 50
+ Refunded: 20
= Closing Balance: 170 coupon credits ✅

Opening Balance: 0
+ Purchased: 300
- Used: 10
= Closing Balance: 290 wa_ui credits ✅

Opening Balance: 0
+ Purchased: 100
- Used: 5
= Closing Balance: 95 wa_bi credits ✅
```

---

## ✅ Test Completion Checklist

- [ ] Test Suite 1: Credit Purchase → Ledger Entry
- [ ] Test Suite 2: Coupon Batch → Ledger Deduction
- [ ] Test Suite 3: WhatsApp UI → Ledger Tracking
- [ ] Test Suite 4: WhatsApp BI → Ledger Tracking
- [ ] Test Suite 5: Expiry Refund → Ledger Tracking
- [ ] Test Suite 6: Monthly Statement Generation
- [ ] Test Suite 7: Automated Cron Jobs
- [ ] Final Integration Test

---

## 🐛 Common Issues & Solutions

### Issue 1: Ledger Entry Not Created
**Symptom:** Credits deducted but no ledger entry

**Solution:**
- Check if CreditLedgerService is properly injected
- Verify ledger entry creation happens AFTER transaction commit
- Check database for any constraint violations

### Issue 2: Balance Mismatch
**Symptom:** Statement balances don't match ledger

**Solution:**
- Check ledger entries for missing or duplicate records
- Verify balance_before and balance_after values
- Recalculate manually using ledger entries

### Issue 3: PDF Not Generated
**Symptom:** Statement created but no PDF file

**Solution:**
- Check uploads/statements/ directory exists with write permissions
- Verify pdfkit is properly installed
- Check PDF generation logs for errors

### Issue 4: Cron Jobs Not Running
**Symptom:** No automatic statements or refunds

**Solution:**
- Verify ScheduleModule is imported in AppModule
- Check cron service is properly registered
- Review PM2 logs for cron execution

---

## 📝 Test Report Template

```markdown
# M4 Testing Report - [Date]

## Environment:
- Backend Version: 
- Database: 
- Tester: 

## Test Results:

### Test Suite 1: Credit Purchase
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 2: Coupon Batch
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 3: WhatsApp UI
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 4: WhatsApp BI
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 5: Expiry Refund
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 6: Monthly Statement
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test Suite 7: Cron Jobs
- Status: ✅ PASS / ❌ FAIL
- Notes: 

## Issues Found:
1. 
2. 
3. 

## Recommendations:
1. 
2. 
3. 

## Overall Status: ✅ READY FOR PRODUCTION / ⚠️ NEEDS FIXES
```

---

## 🎓 Next Steps After Testing

1. **Document Issues**: Log all bugs in issue tracker
2. **Performance Testing**: Test with large datasets (1000+ merchants, 10000+ ledger entries)
3. **Load Testing**: Verify cron jobs handle concurrent operations
4. **Security Testing**: Verify role-based access controls
5. **User Acceptance Testing**: Get merchant feedback on statements
