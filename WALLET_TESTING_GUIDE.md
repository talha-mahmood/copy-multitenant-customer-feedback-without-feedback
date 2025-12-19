# Wallet System Testing Guide

## 📋 Prerequisites

1. **Import Postman Collection:**
   - Open Postman
   - Click "Import" → Select `postman-collection-with-wallets.json`
   - Collection will auto-save JWT token and IDs for you

2. **Start the Server:**
   ```bash
   npm run start:dev
   ```

3. **Database Ready:**
   - Migrations run: `npm run migration:run`
   - Database seeded (optional): `npm run seed`

---

## 🧪 Step-by-Step Testing Flow

### **STEP 1: Login (Get JWT Token)**

**Endpoint:**
```
POST {{base_url}}/auth/login
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**What Happens:**
- Returns JWT token
- Postman auto-saves token to `{{jwt_token}}` variable
- All subsequent requests use this token

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

---

### **STEP 2: Create Admin (Auto-creates Admin Wallet)**

**Endpoint:**
```
POST {{base_url}}/admins
```

**Body:**
```json
{
  "name": "John Agent",
  "email": "agent1@example.com",
  "password": "password123",
  "phone": "+60123456789",
  "address": "123 Agent Street, KL"
}
```

**What Happens:**
1. Admin record created in `admins` table
2. **Wallet automatically created** in `admin_wallets` table
3. Postman auto-saves `admin_id` to `{{admin_id}}` variable

**Expected Response:**
```json
{
  "message": "Admin created successfully",
  "data": {
    "id": 1,
    "name": "John Agent",
    "email": "agent1@example.com",
    "phone": "+60123456789",
    "address": "123 Agent Street, KL",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Database Check:**
```sql
-- Check if admin wallet was created
SELECT * FROM admin_wallets WHERE admin_id = 1;

-- Expected result:
-- id | admin_id | balance | total_earnings | total_spent | currency
-- 1  | 1        | 0.00    | 0.00           | 0.00        | MYR
```

---

### **STEP 3: Get Admin Wallet (Verify Wallet Created)**

**Endpoint:**
```
GET {{base_url}}/wallets/admin/{{admin_id}}
```

**What Happens:**
- Retrieves the auto-created admin wallet
- Shows initial balance (0.00)

**Expected Response:**
```json
{
  "id": 1,
  "admin_id": 1,
  "balance": 0.00,
  "total_earnings": 0.00,
  "total_spent": 0.00,
  "pending_amount": 0.00,
  "currency": "MYR",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**✅ Success Indicator:**
- Wallet exists with `admin_id` matching the created admin
- `balance`, `total_earnings`, `total_spent` all at 0.00

---

### **STEP 4: Create Merchant (Auto-creates Merchant Wallet)**

**Endpoint:**
```
POST {{base_url}}/merchants
```

**Body:**
```json
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
1. User created with merchant role
2. Merchant record created
3. **Wallet automatically created** in `merchant_wallets` table
4. **QR code automatically generated** and stored
5. Postman auto-saves `merchant_id` to `{{merchant_id}}` variable

**Expected Response:**
```json
{
  "message": "Merchant created successfully",
  "data": {
    "id": 1,
    "user_id": 2,
    "business_name": "John's Coffee Shop",
    "business_type": "F&B",
    "merchant_type": "annual",
    "address": "456 Business St, KL",
    "tax_id": "TX123456",
    "qr_code_url": "http://localhost:3000/feedback?mid=1&hash=...",
    "qr_code_hash": "abc123def456...",
    "qr_code_image": "data:image/png;base64,iVBORw0KGgo...",
    "created_at": "2025-01-15T10:35:00Z"
  }
}
```

**Database Check:**
```sql
-- Check if merchant wallet was created
SELECT * FROM merchant_wallets WHERE merchant_id = 1;

-- Expected result:
-- id | merchant_id | message_credits | marketing_credits | utility_credits | subscription_type | annual_fee_paid
-- 1  | 1           | 0               | 0                 | 0               | annual            | false
```

---

### **STEP 5: Get Merchant Wallet (Verify Wallet Created)**

**Endpoint:**
```
GET {{base_url}}/wallets/merchant/{{merchant_id}}
```

**What Happens:**
- Retrieves the auto-created merchant wallet
- Shows initial credits (all 0)
- Shows subscription type ('annual' or 'temporary')

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
  "subscription_expires_at": null,
  "annual_fee_paid": false,
  "currency": "MYR",
  "is_active": true,
  "created_at": "2025-01-15T10:35:00Z",
  "updated_at": "2025-01-15T10:35:00Z"
}
```

**✅ Success Indicators:**
- Wallet exists with `merchant_id` matching created merchant
- All credits at 0
- `subscription_type` matches what was passed in merchant creation ('annual' or 'temporary')
- `annual_fee_paid` is false initially

---

### **STEP 6: Get Credit Packages**

**Endpoint:**
```
GET {{base_url}}/wallets/credit-packages
```

**What Happens:**
- Returns all 10 pre-seeded credit packages
- Shows pricing for both annual and temporary merchants

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Starter Package",
    "description": "100 marketing messages",
    "credits": 100,
    "credit_type": "marketing",
    "price": 50.00,
    "price_per_credit": 0.50,
    "currency": "MYR",
    "merchant_type": "annual",
    "is_active": true,
    "sort_order": 1,
    "bonus_credits": 0
  },
  {
    "id": 2,
    "name": "Basic Package",
    "description": "500 marketing messages",
    "credits": 500,
    "credit_type": "marketing",
    "price": 225.00,
    "price_per_credit": 0.45,
    "currency": "MYR",
    "merchant_type": "annual",
    "is_active": true,
    "sort_order": 2,
    "bonus_credits": 0
  }
  // ... 8 more packages
]
```

**Filter by merchant type:**
```
GET {{base_url}}/wallets/credit-packages?merchant_type=annual
GET {{base_url}}/wallets/credit-packages?merchant_type=temporary
```

---

### **STEP 7: Add Credits to Merchant**

**Endpoint:**
```
POST {{base_url}}/wallets/merchant/{{merchant_id}}/add-credits
```

**Body:**
```json
{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "description": "Professional Package purchase",
  "metadata": {
    "package_id": 3,
    "package_name": "Professional Package"
  }
}
```

**What Happens:**
1. Merchant wallet updated with +1000 credits
2. Transaction record created in `wallet_transactions`
3. `message_credits` and `marketing_credits` both increase by 1000
4. `total_credits_purchased` increases by 1000

**Expected Response:**
```json
{
  "message": "Credits added successfully",
  "data": {
    "id": 1,
    "merchant_wallet_id": 1,
    "type": "purchase",
    "credits": 1000,
    "credit_type": "marketing",
    "amount": 400.00,
    "status": "completed",
    "description": "Professional Package purchase",
    "completed_at": "2025-01-15T10:40:00Z",
    "created_at": "2025-01-15T10:40:00Z"
  }
}
```

**Database Check:**
```sql
-- Check merchant wallet updated
SELECT * FROM merchant_wallets WHERE merchant_id = 1;

-- Expected result:
-- message_credits: 1000
-- marketing_credits: 1000
-- total_credits_purchased: 1000

-- Check transaction created
SELECT * FROM wallet_transactions WHERE merchant_wallet_id = 1;
```

---

### **STEP 8: Get Merchant Wallet (Verify Credits Added)**

**Endpoint:**
```
GET {{base_url}}/wallets/merchant/{{merchant_id}}
```

**Expected Response (updated):**
```json
{
  "id": 1,
  "merchant_id": 1,
  "message_credits": 1000,
  "marketing_credits": 1000,
  "utility_credits": 0,
  "total_credits_purchased": 1000,
  "total_credits_used": 0,
  "subscription_type": "annual",
  "subscription_expires_at": null,
  "annual_fee_paid": false,
  "currency": "MYR",
  "is_active": true
}
```

**✅ Success Indicators:**
- `message_credits` = 1000
- `marketing_credits` = 1000
- `total_credits_purchased` = 1000
- `total_credits_used` = 0

---

### **STEP 9: Get Merchant Transactions**

**Endpoint:**
```
GET {{base_url}}/wallets/merchant/{{merchant_id}}/transactions?page=1&limit=20
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "merchant_wallet_id": 1,
      "type": "purchase",
      "credits": 1000,
      "credit_type": "marketing",
      "amount": 400.00,
      "status": "completed",
      "description": "Professional Package purchase",
      "metadata": "{\"package_id\":3,\"package_name\":\"Professional Package\"}",
      "completed_at": "2025-01-15T10:40:00Z",
      "created_at": "2025-01-15T10:40:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### **STEP 10: Upgrade Merchant to Annual (Test Commission)**

**Endpoint:**
```
POST {{base_url}}/wallets/merchant/{{merchant_id}}/upgrade-to-annual
```

**Body:**
```json
{
  "amount": 1199.00,
  "admin_id": {{admin_id}}
}
```

**What Happens:**
1. Merchant wallet updated:
   - `subscription_type` → 'annual'
   - `annual_fee_paid` → true
   - `subscription_expires_at` → +1 year from now
2. **Admin wallet credited** with RM900.00 (75% commission)
3. Transaction created for admin wallet
4. Admin `balance` and `total_earnings` increase by 900.00

**Expected Response:**
```json
{
  "message": "Merchant upgraded to annual subscription",
  "data": {
    "success": true,
    "expires_at": "2026-01-15T10:45:00Z"
  }
}
```

**Database Check:**
```sql
-- Check merchant wallet updated
SELECT subscription_type, annual_fee_paid, subscription_expires_at 
FROM merchant_wallets WHERE merchant_id = 1;

-- Expected:
-- subscription_type: 'annual'
-- annual_fee_paid: true
-- subscription_expires_at: 2026-01-15 (1 year from now)

-- Check admin wallet credited with commission
SELECT balance, total_earnings FROM admin_wallets WHERE admin_id = 1;

-- Expected:
-- balance: 900.00
-- total_earnings: 900.00
```

---

### **STEP 11: Get Admin Wallet (Verify Commission Credited)**

**Endpoint:**
```
GET {{base_url}}/wallets/admin/{{admin_id}}
```

**Expected Response (updated):**
```json
{
  "id": 1,
  "admin_id": 1,
  "balance": 900.00,
  "total_earnings": 900.00,
  "total_spent": 0.00,
  "pending_amount": 0.00,
  "currency": "MYR",
  "is_active": true
}
```

**✅ Success Indicators:**
- `balance` = 900.00 (75% of 1199.00)
- `total_earnings` = 900.00
- Commission automatically credited when merchant upgrades

---

### **STEP 12: Get Admin Transactions**

**Endpoint:**
```
GET {{base_url}}/wallets/admin/{{admin_id}}/transactions?page=1&limit=20
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "admin_wallet_id": 1,
      "type": "commission",
      "amount": 900.00,
      "status": "completed",
      "description": "Annual subscription commission from merchant #1",
      "metadata": "{\"merchant_id\":1,\"total_amount\":1199}",
      "balance_before": 0.00,
      "balance_after": 900.00,
      "completed_at": "2025-01-15T10:45:00Z",
      "created_at": "2025-01-15T10:45:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 🎯 Quick Test Summary

### **Test Admin Wallet Creation:**
```
1. POST /admins (create admin)
2. GET /wallets/admin/:adminId (verify wallet exists with balance 0)
```

### **Test Merchant Wallet Creation:**
```
1. POST /merchants (create merchant)
2. GET /wallets/merchant/:merchantId (verify wallet exists with 0 credits)
```

### **Test Credit Purchase Flow:**
```
1. GET /wallets/credit-packages (view available packages)
2. POST /wallets/merchant/:merchantId/add-credits (buy credits)
3. GET /wallets/merchant/:merchantId (verify credits added)
4. GET /wallets/merchant/:merchantId/transactions (view transaction)
```

### **Test Commission Flow:**
```
1. POST /wallets/merchant/:merchantId/upgrade-to-annual (upgrade merchant)
2. GET /wallets/admin/:adminId (verify admin received RM900 commission)
3. GET /wallets/admin/:adminId/transactions (view commission transaction)
4. GET /wallets/merchant/:merchantId (verify merchant upgraded to annual)
```

---

## 📊 Expected Database State After Full Test

### Admin Wallets Table:
```
id | admin_id | balance | total_earnings | total_spent | currency
1  | 1        | 900.00  | 900.00         | 0.00        | MYR
```

### Merchant Wallets Table:
```
id | merchant_id | message_credits | marketing_credits | subscription_type | annual_fee_paid
1  | 1           | 1000            | 1000              | annual            | true
```

### Wallet Transactions Table:
```
id | admin_wallet_id | merchant_wallet_id | type       | amount  | credits | description
1  | NULL            | 1                  | purchase   | 400.00  | 1000    | Professional Package purchase
2  | 1               | NULL               | commission | 900.00  | NULL    | Annual subscription commission...
```

---

## 🐛 Troubleshooting

### Issue: "Admin wallet not found"
**Solution:** 
- Make sure admin was created successfully
- Check if WalletModule is imported in AdminModule
- Verify database migration ran successfully

### Issue: "Merchant wallet not found"
**Solution:**
- Ensure merchant creation completed
- Check if WalletModule is imported in MerchantModule
- Check database: `SELECT * FROM merchant_wallets;`

### Issue: Commission not credited to admin
**Solution:**
- Verify correct `admin_id` passed in upgrade request
- Check admin wallet exists before upgrade
- Check transaction logs: `SELECT * FROM wallet_transactions WHERE type = 'commission';`

### Issue: Credits not showing after purchase
**Solution:**
- Check transaction status in database
- Verify `credit_type` is valid ('marketing', 'utility', or 'general')
- Check merchant wallet: `SELECT * FROM merchant_wallets WHERE merchant_id = X;`

---

## ✅ Success Checklist

After running all tests, you should see:

- [x] Admin created → Admin wallet auto-created with balance 0
- [x] Merchant created → Merchant wallet auto-created with 0 credits
- [x] Credit packages retrieved (10 packages seeded)
- [x] Credits purchased → Merchant wallet updated
- [x] Transaction recorded in wallet_transactions
- [x] Merchant upgraded to annual
- [x] Admin wallet credited with RM900 commission
- [x] Admin transaction shows commission
- [x] Merchant shows annual subscription with expiry date
- [x] All GET endpoints return correct data
- [x] Pagination works on transaction endpoints

---

## 📝 Additional Test Cases

### Test Utility Credits:
```json
POST /wallets/merchant/:merchantId/add-credits
{
  "credits": 500,
  "credit_type": "utility",
  "amount": 75.00,
  "description": "Utility Starter Package"
}
```

Expected: `utility_credits` increases by 500

### Test General Credits (Temporary Merchant):
Create temporary merchant:
```json
POST /merchants
{
  ...
  "merchant_type": "temporary"
}
```

Add general credits:
```json
POST /wallets/merchant/:merchantId/add-credits
{
  "credits": 100,
  "credit_type": "general",
  "amount": 28.00,
  "description": "Temp Basic Package"
}
```

### Test Insufficient Balance (Should Fail):
After using all credits, try deducting more:
```typescript
// This would be in WhatsApp service integration
await walletService.deductMerchantCredits(merchantId, 2000, 'marketing', 'Test');
```

Expected: `BadRequestException: Insufficient marketing credits`

---

## 🎓 Next Steps After Testing

1. **Integrate with WhatsApp Service:**
   - Deduct credits before sending messages
   - Handle errors when credits insufficient

2. **Build Dashboard UI:**
   - Display wallet balance
   - Show transaction history
   - Credit purchase interface

3. **Payment Gateway Integration:**
   - Add Stripe/PayPal for credit purchases
   - Handle payment success/failure

4. **Analytics:**
   - Track credit usage patterns
   - Generate monthly statements
   - Commission reports for admins

5. **Automated Tests:**
   - Write unit tests for WalletService
   - E2E tests for wallet flows
   - Test transaction rollbacks

---

## 📞 Support

For issues or questions:
1. Check WALLET_SYSTEM_README.md
2. Review database state with SQL queries
3. Check application logs
4. Contact development team

**Happy Testing! 🚀**
