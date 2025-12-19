# 🎯 Wallet System - Quick Testing Reference

## 📌 Import Postman Collection
File: `postman-collection-with-wallets.json`

---

## 🔑 Critical Endpoints for Testing Wallet Creation & Retrieval

### **1️⃣ CREATE ADMIN → AUTO-CREATES ADMIN WALLET**

```http
POST http://localhost:8000/api/v1/admins
Content-Type: application/json
Authorization: Bearer {{jwt_token}}

{
  "name": "John Agent",
  "email": "agent1@example.com",
  "password": "password123",
  "phone": "+60123456789",
  "address": "123 Agent Street, KL"
}
```

**What Happens:** Admin wallet automatically created with balance 0.00

---

### **2️⃣ GET ADMIN WALLET → VERIFY CREATION**

```http
GET http://localhost:8000/api/v1/wallets/admin/1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "id": 1,
  "admin_id": 1,
  "balance": 0.00,
  "total_earnings": 0.00,
  "total_spent": 0.00,
  "currency": "MYR",
  "is_active": true
}
```

✅ **Success:** Wallet exists, all values at 0

---

### **3️⃣ CREATE MERCHANT → AUTO-CREATES MERCHANT WALLET**

```http
POST http://localhost:8000/api/v1/merchants
Content-Type: application/json
Authorization: Bearer {{jwt_token}}

{
  "firstName": "John",
  "lastName": "Merchant",
  "email": "merchant1@example.com",
  "password": "password123",
  "role": "merchant",
  "address": "456 Business St, KL",
  "business_name": "John's Coffee Shop",
  "business_type": "F&B",
  "merchant_type": "annual",
  "tax_id": "TX123456"
}
```

**What Happens:** 
- Merchant wallet automatically created with 0 credits
- QR code automatically generated

---

### **4️⃣ GET MERCHANT WALLET → VERIFY CREATION**

```http
GET http://localhost:8000/api/v1/wallets/merchant/1
Authorization: Bearer {{jwt_token}}
```

**Expected Response:**
```json
{
  "id": 1,
  "merchant_id": 1,
  "message_credits": 0,
  "marketing_credits": 0,
  "utility_credits": 0,
  "total_credits_purchased": 0,
  "total_credits_used": 0,
  "subscription_type": "annual",
  "annual_fee_paid": false,
  "currency": "MYR",
  "is_active": true
}
```

✅ **Success:** Wallet exists, all credits at 0

---

## 💰 Additional Wallet Endpoints

### **Get Admin Transactions**
```http
GET http://localhost:8000/api/v1/wallets/admin/1/transactions?page=1&limit=20
```

### **Get Merchant Transactions**
```http
GET http://localhost:8000/api/v1/wallets/merchant/1/transactions?page=1&limit=20
```

### **Add Credits to Merchant**
```http
POST http://localhost:8000/api/v1/wallets/merchant/1/add-credits
Content-Type: application/json

{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "description": "Professional Package purchase"
}
```

### **Upgrade to Annual (Credits Admin RM900)**
```http
POST http://localhost:8000/api/v1/wallets/merchant/1/upgrade-to-annual
Content-Type: application/json

{
  "amount": 1199.00,
  "admin_id": 1
}
```

### **Get Credit Packages**
```http
GET http://localhost:8000/api/v1/wallets/credit-packages
GET http://localhost:8000/api/v1/wallets/credit-packages?merchant_type=annual
GET http://localhost:8000/api/v1/wallets/credit-packages?merchant_type=temporary
```

---

## 📊 Database Verification Queries

### Check if admin wallet created:
```sql
SELECT * FROM admin_wallets WHERE admin_id = 1;
```

### Check if merchant wallet created:
```sql
SELECT * FROM merchant_wallets WHERE merchant_id = 1;
```

### View all transactions:
```sql
SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 10;
```

### Check credit packages seeded:
```sql
SELECT id, name, credits, price, merchant_type FROM credit_packages;
```

---

## ✅ Quick Test Sequence

```bash
# 1. Login and get token
POST /auth/login

# 2. Create admin (wallet auto-created)
POST /admins

# 3. Verify admin wallet exists
GET /wallets/admin/:adminId

# 4. Create merchant (wallet auto-created)
POST /merchants

# 5. Verify merchant wallet exists
GET /wallets/merchant/:merchantId

# 6. View credit packages
GET /wallets/credit-packages

# 7. Add credits to merchant
POST /wallets/merchant/:merchantId/add-credits

# 8. Verify credits added
GET /wallets/merchant/:merchantId

# 9. Upgrade merchant to annual
POST /wallets/merchant/:merchantId/upgrade-to-annual

# 10. Verify admin received commission
GET /wallets/admin/:adminId
```

---

## 🎓 Expected Results Summary

| Action | Expected Outcome |
|--------|------------------|
| Create Admin | Admin wallet created with balance = 0.00 |
| Create Merchant | Merchant wallet created with credits = 0 |
| Add 1000 Credits | message_credits = 1000, marketing_credits = 1000 |
| Upgrade to Annual | Admin balance = 900.00, Merchant annual_fee_paid = true |
| Get Transactions | Shows purchase and commission transactions |

---

## 🐛 Common Issues

**Wallet not found:** Run migrations: `npm run migration:run`

**Unauthorized:** Login first: `POST /auth/login`

**Commission not credited:** Check admin_id is correct in upgrade request

**Credits not added:** Verify credit_type is 'marketing', 'utility', or 'general'

---

## 📚 Full Documentation

- Detailed Guide: `WALLET_TESTING_GUIDE.md`
- System Documentation: `WALLET_SYSTEM_README.md`
- Postman Collection: `postman-collection-with-wallets.json`

---

**Quick Start:**
1. Import Postman collection
2. Login → Creates `{{jwt_token}}`
3. Create Admin → Creates `{{admin_id}}`
4. Create Merchant → Creates `{{merchant_id}}`
5. Get wallets to verify creation
6. Test credit operations

✨ **That's it! You're ready to test the wallet system!**
