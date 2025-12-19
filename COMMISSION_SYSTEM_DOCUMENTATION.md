# 💰 Commission System Documentation

## Overview
The commission system automatically credits admin (agent) wallets when merchants purchase credits. Commission rates vary based on merchant subscription type.

---

## 🎯 Commission Structure

### Commission Rates by Merchant Type

| Merchant Type | Commission Rate | Admin Earns | Platform Keeps |
|--------------|----------------|-------------|----------------|
| **Temporary** | 20% | RM20 per RM100 | RM80 per RM100 |
| **Annual** | 10% | RM10 per RM100 | RM90 per RM100 |

### Why Different Rates?

**Temporary Merchants (20%)**
- Higher rate to incentivize agent acquisition
- Pay-as-you-go model generates ongoing revenue
- No upfront commitment from merchant

**Annual Merchants (10%)**
- Lower rate since agent already earned upfront commission (RM900)
- Agent already received 75% of annual fee (RM1199)
- Encourages agents to upsell annual subscriptions

---

## 💸 Revenue Streams for Admins

### 1. Annual Subscription Commission
**Triggered:** When temporary merchant upgrades to annual

```http
POST /wallets/merchant/:merchantId/upgrade-to-annual
{
  "amount": 1199.00,
  "admin_id": 1
}
```

**Admin Earnings:**
- Commission: RM900 (75% of RM1199)
- Platform: RM299 (25%)
- One-time payment

---

### 2. Credit Purchase Commission (NEW!)
**Triggered:** Every time merchant buys credits

```http
POST /wallets/merchant/:merchantId/add-credits
{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "admin_id": 1,
  "description": "Professional Package purchase"
}
```

**Admin Earnings:**

#### For Temporary Merchant:
```
Purchase Amount: RM400.00
Admin Commission (20%): RM80.00
Platform Revenue: RM320.00
```

#### For Annual Merchant:
```
Purchase Amount: RM400.00
Admin Commission (10%): RM40.00
Platform Revenue: RM360.00
```

---

## 🔄 How It Works

### Step-by-Step Flow

1. **Merchant Purchases Credits**
   - Merchant selects credit package
   - API receives purchase request with `admin_id`

2. **System Validates**
   - Checks merchant wallet exists
   - Verifies merchant type (temporary/annual)
   - Validates admin wallet exists

3. **Commission Calculation**
   ```typescript
   const commissionRate = merchant.merchant_type === 'temporary' ? 0.20 : 0.10;
   const adminCommission = amount * commissionRate;
   const platformAmount = amount - adminCommission;
   ```

4. **Credits Added to Merchant**
   - Updates merchant credit balance
   - Records merchant transaction

5. **Admin Wallet Credited**
   - Updates admin balance
   - Updates admin total_earnings
   - Records admin transaction with metadata

6. **Transaction Records Created**
   - Merchant transaction: Type `purchase`
   - Admin transaction: Type `commission`
   - Both include metadata for tracking

---

## 📊 Transaction Examples

### Example 1: Temporary Merchant Buys 100 Credits

**Request:**
```json
POST /wallets/merchant/5/add-credits
{
  "credits": 100,
  "credit_type": "general",
  "amount": 28.00,
  "admin_id": 1,
  "description": "Temp Basic Package"
}
```

**Result:**
```
Merchant receives: 100 credits
Admin earns: RM5.60 (20%)
Platform keeps: RM22.40 (80%)
```

**Merchant Transaction:**
```json
{
  "type": "purchase",
  "credits": 100,
  "credit_type": "general",
  "amount": 28.00,
  "status": "completed",
  "metadata": {
    "commission_rate": 0.20,
    "platform_amount": 22.40
  }
}
```

**Admin Transaction:**
```json
{
  "type": "commission",
  "amount": 5.60,
  "status": "completed",
  "description": "Commission from merchant credit purchase (20%)",
  "balance_before": 900.00,
  "balance_after": 905.60,
  "metadata": {
    "merchant_id": 5,
    "purchase_amount": 28.00,
    "commission_rate": 0.20,
    "credits": 100,
    "credit_type": "general"
  }
}
```

---

### Example 2: Annual Merchant Buys 1000 Credits

**Request:**
```json
POST /wallets/merchant/3/add-credits
{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "admin_id": 1,
  "description": "Professional Package"
}
```

**Result:**
```
Merchant receives: 1000 marketing credits
Admin earns: RM40.00 (10%)
Platform keeps: RM360.00 (90%)
```

**Admin Transaction:**
```json
{
  "type": "commission",
  "amount": 40.00,
  "status": "completed",
  "description": "Commission from merchant credit purchase (10%)",
  "balance_before": 905.60,
  "balance_after": 945.60,
  "metadata": {
    "merchant_id": 3,
    "purchase_amount": 400.00,
    "commission_rate": 0.10,
    "credits": 1000,
    "credit_type": "marketing"
  }
}
```

---

## 🎯 Total Admin Earnings Example

**Scenario:** Agent has 1 Annual Merchant who was upgraded from temporary

### Phase 1: Upgrade to Annual
```
Upgrade Fee: RM1199
Agent Earns: RM900 (75%)
Balance: RM900.00
```

### Phase 2: Credit Purchases (Monthly)
```
Month 1: RM400 purchase → RM40 commission (10%)
Month 2: RM225 purchase → RM22.50 commission
Month 3: RM400 purchase → RM40 commission
Month 4: RM225 purchase → RM22.50 commission

Total Commission: RM125.00
Total Balance: RM1025.00
```

### Phase 3: Additional Temporary Merchants
```
Temp Merchant 1: RM28 purchase → RM5.60 commission (20%)
Temp Merchant 2: RM52 purchase → RM10.40 commission
Temp Merchant 3: RM15 purchase → RM3.00 commission

Total Commission: RM19.00
Total Balance: RM1044.00
```

---

## 🔍 Tracking & Reports

### Admin Wallet Balance
```http
GET /wallets/admin/1

Response:
{
  "balance": 1044.00,
  "total_earnings": 1044.00,
  "total_spent": 0.00,
  "pending_amount": 0.00
}
```

### Admin Transaction History
```http
GET /wallets/admin/1/transactions?page=1&limit=50

Shows:
- All commission transactions
- Purchase amounts
- Merchant IDs
- Commission rates
- Timestamps
```

### Filter by Transaction Type
```sql
SELECT * FROM wallet_transactions 
WHERE admin_wallet_id = 1 
AND type = 'commission'
ORDER BY created_at DESC;
```

---

## 💡 Business Rules

### Commission Rules
1. ✅ Commission credited **immediately** when merchant purchases credits
2. ✅ Commission based on merchant type at time of purchase
3. ✅ If merchant upgrades from temporary to annual, **future purchases** get 10% rate
4. ✅ Annual upgrade commission (RM900) is separate from credit purchase commissions
5. ✅ All transactions are atomic (both merchant and admin or neither)

### Error Handling
```typescript
// If admin wallet not found
throw new NotFoundException('Admin wallet not found');

// If merchant wallet not found
throw new NotFoundException('Merchant wallet not found');

// Transaction fails → Both merchant and admin operations rolled back
await queryRunner.rollbackTransaction();
```

---

## 🔧 API Endpoints

### Add Credits with Commission
```http
POST /wallets/merchant/:merchantId/add-credits
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "admin_id": 1,
  "description": "Professional Package purchase",
  "metadata": {
    "package_id": 3,
    "package_name": "Professional Package"
  }
}
```

**Response:**
```json
{
  "message": "Credits added successfully",
  "data": {
    "merchantTransaction": {
      "id": 45,
      "merchant_wallet_id": 3,
      "type": "purchase",
      "credits": 1000,
      "credit_type": "marketing",
      "amount": 400.00,
      "status": "completed"
    },
    "adminTransaction": {
      "id": 46,
      "admin_wallet_id": 1,
      "type": "commission",
      "amount": 40.00,
      "status": "completed"
    },
    "commission": 40.00
  }
}
```

---

## 📈 Revenue Distribution

### Platform Revenue Model

**Per RM1000 Revenue:**

| Source | Temporary (20% Agent) | Annual (10% Agent) |
|--------|----------------------|-------------------|
| Agent Commission | RM200 | RM100 |
| Platform Revenue | RM800 | RM900 |

**Plus Annual Fees:**
- RM1199 per annual merchant
  - RM900 to agent (75%)
  - RM299 to platform (25%)

---

## ✅ Testing Commission System

### Test Flow

1. **Create Admin**
```http
POST /admins
{
  "name": "Test Agent",
  "email": "agent@test.com",
  "password": "password123"
}
// admin_id = 1
```

2. **Create Temporary Merchant**
```http
POST /merchants
{
  "name": "Test Merchant",
  "email": "merchant@test.com",
  "password": "password123",
  "merchant_type": "temporary",
  ...
}
// merchant_id = 5
```

3. **Purchase Credits (20% commission)**
```http
POST /wallets/merchant/5/add-credits
{
  "credits": 100,
  "credit_type": "general",
  "amount": 28.00,
  "admin_id": 1
}
```

4. **Verify Admin Balance**
```http
GET /wallets/admin/1
// balance should be 5.60 (20% of 28.00)
```

5. **Upgrade to Annual**
```http
POST /wallets/merchant/5/upgrade-to-annual
{
  "amount": 1199.00,
  "admin_id": 1
}
```

6. **Verify Admin Balance**
```http
GET /wallets/admin/1
// balance should be 905.60 (5.60 + 900.00)
```

7. **Purchase More Credits (10% commission now)**
```http
POST /wallets/merchant/5/add-credits
{
  "credits": 500,
  "credit_type": "marketing",
  "amount": 225.00,
  "admin_id": 1
}
```

8. **Verify Final Admin Balance**
```http
GET /wallets/admin/1
// balance should be 928.10 (905.60 + 22.50)
```

---

## 🛠️ Database Schema

### Admin Wallet Tracking
```sql
admin_wallets:
  - balance (current withdrawable amount)
  - total_earnings (all-time commission total)
  - total_spent (all-time withdrawals)
  - pending_amount (reserved/processing)
```

### Transaction Metadata
```json
{
  "merchant_id": 5,
  "purchase_amount": 400.00,
  "commission_rate": 0.10,
  "credits": 1000,
  "credit_type": "marketing",
  "platform_amount": 360.00
}
```

---

## 📊 Reporting Queries

### Total Commission by Admin
```sql
SELECT 
  admin_id,
  SUM(amount) as total_commission,
  COUNT(*) as transaction_count
FROM wallet_transactions
WHERE type = 'commission'
  AND status = 'completed'
GROUP BY admin_id;
```

### Commission by Merchant Type
```sql
SELECT 
  wt.metadata->>'merchant_id' as merchant_id,
  m.merchant_type,
  SUM(wt.amount) as total_commission
FROM wallet_transactions wt
JOIN merchants m ON m.id = CAST(wt.metadata->>'merchant_id' AS INTEGER)
WHERE wt.type = 'commission'
GROUP BY merchant_id, m.merchant_type;
```

### Monthly Commission Report
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  admin_wallet_id,
  SUM(amount) as monthly_commission
FROM wallet_transactions
WHERE type = 'commission'
  AND status = 'completed'
GROUP BY month, admin_wallet_id
ORDER BY month DESC;
```

---

## 🎓 Key Takeaways

1. **Dual Revenue for Admins:**
   - Upfront: RM900 per annual upgrade
   - Recurring: 10-20% on every credit purchase

2. **Automatic & Transparent:**
   - Commissions credited instantly
   - Full transaction history
   - Metadata tracking for reports

3. **Business Logic:**
   - Higher rate (20%) for temporary merchants
   - Lower rate (10%) for annual merchants (already got upfront)
   - All operations are atomic (transaction-safe)

4. **Scalable:**
   - Works with unlimited admins
   - Handles unlimited merchants per admin
   - No manual intervention needed

---

## 📚 Related Documentation

- [WALLET_SYSTEM_README.md](./WALLET_SYSTEM_README.md) - Complete wallet system
- [WALLET_TESTING_GUIDE.md](./WALLET_TESTING_GUIDE.md) - Testing instructions
- [WALLET_QUICK_REFERENCE.md](./WALLET_QUICK_REFERENCE.md) - Quick API reference

---

**✨ Commission System Active!**
Admins now earn on every merchant transaction, creating sustainable recurring revenue for agents.
