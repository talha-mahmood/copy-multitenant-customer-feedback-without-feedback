# Milestone 4 - New API Endpoints for Postman Collection

This document lists all new endpoints added for **Credits Ledger** and **Monthly PDF Statements** features.

## 📊 Credits Ledger Endpoints

### 1. Get Credit Ledger Entries
**GET** `/credit-ledgers`

Query all credit ledger entries with filtering and pagination.

**Query Parameters:**
- `owner_type` (optional): `merchant` | `agent` | `master`
- `owner_id` (optional): number
- `credit_type` (optional): `coupon` | `wa_ui` | `wa_bi` | `paid_ads`
- `action` (optional): `purchase` | `deduct` | `refund` | `adjustment`
- `start_date` (optional): ISO date string (e.g., `2026-01-01`)
- `end_date` (optional): ISO date string (e.g., `2026-01-31`)
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 50, max: 100)

**Authorization:** JWT Bearer Token

**Response Example:**
```json
{
  "data": [
    {
      "id": 1,
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
      "created_at": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "owner_type": "merchant",
      "owner_id": 5,
      "credit_type": "coupon",
      "action": "deduct",
      "amount": -20,
      "balance_before": 150,
      "balance_after": 130,
      "related_object_type": "coupon_batch",
      "related_object_id": 45,
      "description": "Deducted 20 coupon credits for batch 'Summer Sale 2026'",
      "metadata": {
        "batch_id": 45,
        "batch_name": "Summer Sale 2026"
      },
      "created_at": "2026-01-20T14:45:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

**Role Access:**
- **Merchant**: Can only see own ledger entries
- **Agent**: Can only see own ledger entries
- **Superadmin**: Can see all ledger entries

---

### 2. Get Credit Balances
**GET** `/credit-ledgers/balances`

Get current credit balances for a specific owner.

**Query Parameters:**
- `owner_type` (required): `merchant` | `agent` | `master`
- `owner_id` (required): number

**Authorization:** JWT Bearer Token

**Response Example:**
```json
{
  "owner_type": "merchant",
  "owner_id": 5,
  "balances": {
    "coupon": 130,
    "wa_ui": 250,
    "wa_bi": 50,
    "paid_ads": 100
  },
  "last_updated": "2026-01-20T14:45:00.000Z"
}
```

---

## 📄 Monthly Statements Endpoints

### 3. Generate Monthly Statements
**POST** `/monthly-statements/generate`

Manually trigger generation of monthly statements for a specific month and year.

**Request Body:**
```json
{
  "year": 2026,
  "month": 1,
  "owner_type": "merchant",
  "owner_id": 5
}
```

**Request Body Parameters:**
- `year` (required): number (e.g., 2026)
- `month` (required): number (1-12)
- `owner_type` (optional): `merchant` | `agent` | `master` (if not provided, generates for all)
- `owner_id` (optional): number (if not provided, generates for all of specified type)

**Authorization:** JWT Bearer Token (Superadmin only for generating all statements)

**Response Example:**
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
        "bi_messages": 45,
        "ui_success": 78,
        "bi_success": 43
      },
      "credits": {
        "opening_balance": {
          "coupon": 200,
          "wa_ui": 300,
          "wa_bi": 100
        },
        "closing_balance": {
          "coupon": 130,
          "wa_ui": 250,
          "wa_bi": 50
        },
        "purchased": {
          "coupon": 100,
          "wa_ui": 150,
          "wa_bi": 50
        },
        "used": {
          "coupon": 170,
          "wa_ui": 200,
          "wa_bi": 100
        }
      }
    },
    "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
    "status": "generated",
    "created_at": "2026-02-01T01:00:00.000Z"
  }
}
```

---

### 4. Get Monthly Statements
**GET** `/monthly-statements`

Query all monthly statements with filtering.

**Query Parameters:**
- `owner_type` (optional): `merchant` | `agent` | `master`
- `owner_id` (optional): number
- `year` (optional): number
- `month` (optional): number (1-12)
- `status` (optional): `generated` | `sent` | `viewed`
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20, max: 100)

**Authorization:** JWT Bearer Token

**Response Example:**
```json
{
  "data": [
    {
      "id": 15,
      "owner_type": "merchant",
      "owner_id": 5,
      "company_name": "ABC Restaurant Sdn Bhd",
      "year": 2026,
      "month": 1,
      "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
      "status": "generated",
      "created_at": "2026-02-01T01:00:00.000Z"
    },
    {
      "id": 14,
      "owner_type": "merchant",
      "owner_id": 5,
      "company_name": "ABC Restaurant Sdn Bhd",
      "year": 2025,
      "month": 12,
      "pdf_url": "/uploads/statements/merchant-5-2025-12.pdf",
      "status": "viewed",
      "created_at": "2026-01-01T01:00:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Role Access:**
- **Merchant**: Can only see own statements
- **Agent**: Can only see own statements
- **Superadmin**: Can see all statements

---

### 5. Get Single Statement
**GET** `/monthly-statements/:id`

Get details of a specific monthly statement.

**Path Parameters:**
- `id` (required): Statement ID

**Authorization:** JWT Bearer Token

**Response Example:**
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
      "generated": 150,
      "taken": 120,
      "redeemed": 95,
      "expired": 25
    },
    "whatsapp": {
      "ui_messages": 80,
      "bi_messages": 45,
      "ui_success": 78,
      "bi_success": 43,
      "ui_failed": 2,
      "bi_failed": 2
    },
    "credits": {
      "opening_balance": {
        "coupon": 200,
        "wa_ui": 300,
        "wa_bi": 100,
        "paid_ads": 50
      },
      "closing_balance": {
        "coupon": 130,
        "wa_ui": 250,
        "wa_bi": 50,
        "paid_ads": 30
      },
      "purchased": {
        "coupon": 100,
        "wa_ui": 150,
        "wa_bi": 50,
        "paid_ads": 20
      },
      "used": {
        "coupon": 170,
        "wa_ui": 200,
        "wa_bi": 100,
        "paid_ads": 40
      },
      "refunded": {
        "coupon": 0,
        "wa_ui": 0,
        "wa_bi": 0,
        "paid_ads": 0
      }
    }
  },
  "pdf_url": "/uploads/statements/merchant-5-2026-01.pdf",
  "status": "generated",
  "created_at": "2026-02-01T01:00:00.000Z",
  "updated_at": "2026-02-01T01:00:00.000Z"
}
```

---

### 6. Download Statement PDF
**GET** `/monthly-statements/:id/download`

Download the PDF file of a monthly statement.

**Path Parameters:**
- `id` (required): Statement ID

**Authorization:** JWT Bearer Token

**Response:** PDF file download

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="merchant-5-2026-01.pdf"`

---

## 🔄 Cron Jobs (Automatic Operations)

### Monthly Statement Generation
**Schedule:** 1st of every month at 1:00 AM
**Action:** Automatically generates statements for:
- All merchants (previous month)
- All agents (previous month)
- Master platform (previous month)

### Coupon Expiry Refund
**Schedule:** Daily at 2:00 AM
**Action:** 
- Finds expired coupon batches (end_date < now)
- Counts untaken coupons (status='created')
- Refunds unused coupon credits to merchant
- Creates ledger entry with action='refund'
- Marks batch as inactive
- Updates coupon status to 'expired'

---

## 📝 Notes for Postman Collection

### Environment Variables Needed:
```
base_url = http://localhost:3000/api/v1
jwt_token = (auto-saved from login)
merchant_id = (example: 5)
agent_id = (example: 2)
```

### Test Scenarios to Add:

#### Credits Ledger Tests:
1. **Purchase Credits → Verify Ledger Entry**
   - POST `/wallets/merchant/purchase-credits`
   - GET `/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}`
   - Verify: action='purchase', amount > 0

2. **Generate Coupon Batch → Verify Deduction**
   - POST `/coupon-batches`
   - GET `/credit-ledgers?owner_type=merchant&owner_id={{merchant_id}}&action=deduct`
   - Verify: action='deduct', amount < 0, related_object_type='coupon_batch'

3. **Send WhatsApp UI Message → Verify Ledger**
   - POST `/feedbacks` (triggers WhatsApp)
   - GET `/credit-ledgers?owner_type=merchant&credit_type=wa_ui`
   - Verify: action='deduct', credit_type='wa_ui'

4. **Send WhatsApp BI Message → Verify Ledger**
   - POST `/birthday-campaigns/send` (manual trigger)
   - GET `/credit-ledgers?owner_type=merchant&credit_type=wa_bi`
   - Verify: action='deduct', credit_type='wa_bi'

#### Monthly Statement Tests:
1. **Generate Statement for Current Merchant**
   - POST `/monthly-statements/generate`
   - Body: `{"year": 2026, "month": 1, "owner_type": "merchant", "owner_id": {{merchant_id}}}`

2. **View Merchant Statements**
   - GET `/monthly-statements?owner_type=merchant&owner_id={{merchant_id}}`

3. **Download Statement PDF**
   - GET `/monthly-statements/{{statement_id}}/download`

4. **Verify Balance Reconciliation**
   - GET `/credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}`
   - GET `/monthly-statements/{{statement_id}}`
   - Compare: ledger balances match statement closing_balance

---

## 🚀 Import Instructions

1. Open latest Postman collection: `44QR Review & Coupon SaaS API - With Campaigns.postman_collection.json`
2. Add new folder: **"Credits Ledger & Statements"**
3. Add the 6 endpoints above to the folder
4. Set up pre-request scripts for authentication
5. Add test scripts to validate responses
6. Export as version 45

---

## ✅ Integration Checklist

- [x] Credits ledger tracks all credit movements
- [x] Wallet service creates ledger entries on purchase
- [x] Wallet service creates ledger entries on deduction
- [x] Coupon batch creation tracked in ledger
- [x] WhatsApp UI messages tracked in ledger
- [x] WhatsApp BI messages tracked in ledger
- [x] Expiry refunds tracked in ledger
- [x] Monthly statements auto-generate on 1st of month
- [x] PDF generation with company names
- [ ] Postman collection updated with new endpoints
- [ ] End-to-end testing completed
- [ ] Documentation reviewed
