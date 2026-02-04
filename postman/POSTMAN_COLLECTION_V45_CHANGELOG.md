# Postman Collection Update - Version 45

## 📦 What's New

Updated the Postman collection to **Version 45** with new endpoints for **Credits Ledger** and **Monthly PDF Statements** features.

---

## 📁 New Collection Details

**File:** `45QR Review & Coupon SaaS API - With Credits Ledger.postman_collection.json`

**Total Folders:** 25 (added 1 new folder)

**New Folder:** "Credits Ledger & Monthly Statements"

---

## 🆕 New Endpoints Added

### Credits Ledger (7 endpoints)

1. **Get Credit Ledger Entries**
   - `GET /credit-ledgers`
   - Query params: owner_type, owner_id, credit_type, action, start_date, end_date, page, limit
   - Description: Get all ledger entries with filtering

2. **Get Credit Balances**
   - `GET /credit-ledgers/balances`
   - Query params: owner_type, owner_id
   - Description: Get current balances for all credit types

3. **Get Ledger for Purchase Action**
   - `GET /credit-ledgers?action=purchase`
   - Description: View only credit purchase transactions

4. **Get Ledger for Deduct Action**
   - `GET /credit-ledgers?action=deduct&credit_type=coupon`
   - Description: View only credit deduction transactions

5. **Get Ledger for Refund Action**
   - `GET /credit-ledgers?action=refund`
   - Description: View expired coupon batch refunds

6. **Get WhatsApp UI Ledger Entries**
   - `GET /credit-ledgers?credit_type=wa_ui&action=deduct`
   - Description: View user-initiated WhatsApp message costs

7. **Get WhatsApp BI Ledger Entries**
   - `GET /credit-ledgers?credit_type=wa_bi&action=deduct`
   - Description: View business-initiated WhatsApp message costs

### Monthly Statements (6 endpoints)

1. **Generate Monthly Statement**
   - `POST /monthly-statements/generate`
   - Body: `{"year": 2026, "month": 1, "owner_type": "merchant", "owner_id": 5}`
   - Description: Manually trigger statement generation
   - **Auto-saves:** statement_id to collection variables

2. **Get All Monthly Statements**
   - `GET /monthly-statements`
   - Query params: owner_type, owner_id, year, month, status, page, limit
   - Description: List all statements with filtering

3. **Get Single Monthly Statement**
   - `GET /monthly-statements/:statement_id`
   - Description: Get detailed statement data including JSON

4. **Download Statement PDF**
   - `GET /monthly-statements/:statement_id/download`
   - Description: Download PDF file

5. **Get Statements by Year**
   - `GET /monthly-statements?year=2026`
   - Description: Filter statements by year

6. **Get Statement for Specific Month**
   - `GET /monthly-statements?year=2026&month=1`
   - Description: Get statement for specific month

---

## 🔧 Collection Variables

### New Variable Added:
- `statement_id` - Auto-saved when generating statements

### Existing Variables:
- `base_url` - API base URL (default: http://localhost:8000/api/v1)
- `jwt_token` - Auto-saved from login
- `admin_id`
- `staff_id`
- `merchant_id`
- `batch_id`
- `prize_id`
- `result_id`
- `credit_package_id`
- `customer_id`
- `campaign_id`
- `festival_message_id`
- `finance_viewer_id`
- `ad_approver_id`
- `support_staff_id`

---

## 🎯 Testing Workflow

### Test 1: Verify Credit Purchase Creates Ledger Entry

1. **Purchase Credits**
   ```
   POST /wallets/merchant/add-credits
   ```

2. **Check Ledger**
   ```
   GET /credit-ledgers?action=purchase&owner_type=merchant&owner_id={{merchant_id}}
   ```

3. **Verify Response:**
   - ✅ action = 'purchase'
   - ✅ amount > 0
   - ✅ balance_after = balance_before + amount

---

### Test 2: Verify Coupon Batch Generation Tracked

1. **Create Coupon Batch**
   ```
   POST /coupon-batches
   ```

2. **Check Ledger**
   ```
   GET /credit-ledgers?action=deduct&credit_type=coupon&owner_type=merchant&owner_id={{merchant_id}}
   ```

3. **Verify Response:**
   - ✅ action = 'deduct'
   - ✅ amount < 0 (negative)
   - ✅ related_object_type = 'coupon_batch'

---

### Test 3: Verify WhatsApp Messages Tracked

1. **Send Feedback (triggers UI message)**
   ```
   POST /feedbacks
   ```

2. **Check UI Ledger**
   ```
   GET /credit-ledgers?credit_type=wa_ui&action=deduct&owner_type=merchant&owner_id={{merchant_id}}
   ```

3. **Verify Response:**
   - ✅ credit_type = 'wa_ui'
   - ✅ action = 'deduct'
   - ✅ amount = -1
   - ✅ related_object_type = 'whatsapp_message'

---

### Test 4: Generate and Download Statement

1. **Generate Statement**
   ```
   POST /monthly-statements/generate
   Body: {"year": 2026, "month": 1, "owner_type": "merchant", "owner_id": {{merchant_id}}}
   ```
   - Statement ID auto-saved to `{{statement_id}}`

2. **View Statement Details**
   ```
   GET /monthly-statements/{{statement_id}}
   ```
   - Verify: coupons, WhatsApp, credits sections present

3. **Download PDF**
   ```
   GET /monthly-statements/{{statement_id}}/download
   ```
   - Verify: PDF file downloads

4. **Verify Balance Reconciliation**
   ```
   GET /credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}
   ```
   - Compare: ledger balances match statement closing_balance

---

## 📋 Query Parameter Reference

### Credits Ledger Filters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `owner_type` | string | merchant, agent, master | Owner type |
| `owner_id` | number | - | Owner ID |
| `credit_type` | string | coupon, wa_ui, wa_bi, paid_ads | Credit type |
| `action` | string | purchase, deduct, refund, adjustment | Ledger action |
| `start_date` | string | ISO date (2026-01-01) | Filter from date |
| `end_date` | string | ISO date (2026-01-31) | Filter to date |
| `page` | number | Default: 1 | Page number |
| `limit` | number | Default: 50, Max: 100 | Items per page |

### Monthly Statements Filters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `owner_type` | string | merchant, agent, master | Owner type |
| `owner_id` | number | - | Owner ID |
| `year` | number | 2026 | Statement year |
| `month` | number | 1-12 | Statement month |
| `status` | string | generated, sent, viewed | Statement status |
| `page` | number | Default: 1 | Page number |
| `limit` | number | Default: 20, Max: 100 | Items per page |

---

## 🔐 Authorization

All endpoints require **JWT Bearer Token** authentication:

```
Header: Authorization: Bearer {{jwt_token}}
```

The token is auto-saved when you use the Login endpoint.

---

## 📊 Expected Response Structures

### Credit Ledger Entry
```json
{
  "id": 123,
  "owner_type": "merchant",
  "owner_id": 5,
  "credit_type": "coupon",
  "action": "purchase",
  "amount": 100,
  "balance_before": 50,
  "balance_after": 150,
  "related_object_type": "wallet_transaction",
  "related_object_id": 456,
  "description": "Purchased 100 coupon credits",
  "metadata": {},
  "created_at": "2026-01-30T10:00:00.000Z"
}
```

### Credit Balances
```json
{
  "owner_type": "merchant",
  "owner_id": 5,
  "balances": {
    "coupon": 150,
    "wa_ui": 250,
    "wa_bi": 50,
    "paid_ads": 100
  },
  "last_updated": "2026-01-30T10:00:00.000Z"
}
```

### Monthly Statement
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
    "coupons": {
      "generated": 150,
      "taken": 120,
      "redeemed": 95,
      "expired": 25
    },
    "whatsapp": {
      "ui_messages": 80,
      "bi_messages": 45
    },
    "credits": {
      "opening_balance": { "coupon": 200, "wa_ui": 300, "wa_bi": 100 },
      "closing_balance": { "coupon": 130, "wa_ui": 250, "wa_bi": 50 }
    }
  },
  "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
  "status": "generated"
}
```

---

## 📥 How to Import

### Option 1: Import in Postman Desktop
1. Open Postman Desktop App
2. Click "Import" button
3. Select file: `45QR Review & Coupon SaaS API - With Credits Ledger.postman_collection.json`
4. Click "Import"

### Option 2: Replace Existing Collection
1. Delete old collection (v44)
2. Import new collection (v45)
3. Verify all environment variables are set

---

## ✅ Validation Checklist

After importing, verify:

- [ ] Collection name: "45QR Review & Coupon SaaS API - With Credits Ledger"
- [ ] Total folders: 25
- [ ] New folder "Credits Ledger & Monthly Statements" visible
- [ ] 13 new endpoints visible (7 ledger + 6 statements)
- [ ] Collection variable `statement_id` exists
- [ ] JWT token auto-saves on login
- [ ] Statement ID auto-saves on generation

---

## 🔄 Differences from v44

| Aspect | v44 | v45 |
|--------|-----|-----|
| Collection Name | "With Campaigns" | "With Credits Ledger" |
| Total Folders | 24 | 25 |
| New Folder | - | Credits Ledger & Monthly Statements |
| Credits Ledger Endpoints | 0 | 7 |
| Monthly Statement Endpoints | 0 | 6 |
| Collection Variables | 14 | 15 (+statement_id) |
| Description | Campaigns focus | Ledger & statements focus |

---

## 📝 Notes

1. **Backward Compatible**: All existing endpoints from v44 remain unchanged
2. **Auto-Save**: statement_id is automatically saved when generating statements
3. **Filtering**: All query parameters are optional for easier testing
4. **Pagination**: Default page=1, limit=50 for ledger; limit=20 for statements
5. **Access Control**: Endpoints respect role-based access (merchants see own data)

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" responses
**Solution:** Ensure JWT token is set. Run Login endpoint first.

### Issue: Empty ledger results
**Solution:** 
1. Verify merchant_id is correct
2. Check if any transactions have been made
3. Try removing filters to see all entries

### Issue: Statement not found
**Solution:**
1. Verify statement was generated successfully
2. Check statement_id is saved in variables
3. Ensure you have permission to view that statement

### Issue: PDF download fails
**Solution:**
1. Verify statement exists and has pdf_url
2. Check backend uploads/statements/ directory exists
3. Ensure PDF was generated (may take a few seconds)

---

## 📚 Related Documentation

- [POSTMAN_ENDPOINTS_MILESTONE4.md](../POSTMAN_ENDPOINTS_MILESTONE4.md) - Detailed API documentation
- [TESTING_GUIDE_MILESTONE4.md](../TESTING_GUIDE_MILESTONE4.md) - Comprehensive testing procedures
- [MILESTONE4_IMPLEMENTATION_SUMMARY.md](../MILESTONE4_IMPLEMENTATION_SUMMARY.md) - Technical implementation details

---

**Version:** 45  
**Last Updated:** January 30, 2026  
**Status:** ✅ Ready for Testing
