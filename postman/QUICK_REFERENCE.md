# Postman Collection v45 - Quick Reference

## 🚀 New in Version 45

### Credits Ledger (7 endpoints)
```
GET  /credit-ledgers                    - List all ledger entries
GET  /credit-ledgers/balances          - Get current balances
GET  /credit-ledgers?action=purchase   - View purchases
GET  /credit-ledgers?action=deduct     - View deductions
GET  /credit-ledgers?action=refund     - View refunds
GET  /credit-ledgers?credit_type=wa_ui - View UI messages
GET  /credit-ledgers?credit_type=wa_bi - View BI messages
```

### Monthly Statements (6 endpoints)
```
POST /monthly-statements/generate      - Generate statement
GET  /monthly-statements               - List statements
GET  /monthly-statements/:id           - Get statement details
GET  /monthly-statements/:id/download  - Download PDF
GET  /monthly-statements?year=2026     - Filter by year
GET  /monthly-statements?year=2026&month=1 - Specific month
```

---

## 📦 Import Instructions

1. Open Postman
2. Click **Import**
3. Select: `45QR Review & Coupon SaaS API - With Credits Ledger.postman_collection.json`
4. Click **Import**
5. Done! ✅

---

## 🔑 Quick Test

1. **Login** → JWT auto-saves to `{{jwt_token}}`
2. **Get Balances** → `GET /credit-ledgers/balances?owner_type=merchant&owner_id={{merchant_id}}`
3. **Generate Statement** → `POST /monthly-statements/generate` (statement_id auto-saves)
4. **Download PDF** → `GET /monthly-statements/{{statement_id}}/download`

---

## 🎯 Credit Types

- `coupon` - Coupon batch generation
- `wa_ui` - User-initiated WhatsApp (feedback, homepage)
- `wa_bi` - Business-initiated WhatsApp (birthday, festivals)
- `paid_ads` - Advertisement credits

---

## ⚡ Quick Filters

### Ledger
```
?owner_type=merchant&owner_id=5
&credit_type=coupon
&action=purchase
&start_date=2026-01-01
&end_date=2026-01-31
&page=1&limit=50
```

### Statements
```
?owner_type=merchant&owner_id=5
&year=2026
&month=1
&status=generated
&page=1&limit=20
```

---

## 📊 Expected Response Times

| Endpoint | Time |
|----------|------|
| Get Ledger | ~50-100ms |
| Get Balances | ~30-50ms |
| Generate Statement | ~500ms-2s |
| Download PDF | ~100-300ms |

---

## ✅ Validation

After import, verify:
- ✅ 25 total folders
- ✅ New folder: "Credits Ledger & Monthly Statements"
- ✅ 13 new endpoints
- ✅ Collection variable: `statement_id`

---

**Version:** 45  
**Date:** January 30, 2026  
**Status:** ✅ Ready
