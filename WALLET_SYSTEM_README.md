# Wallet System Implementation

## Overview

The wallet system implements a comprehensive credit and transaction management system for the QR Review + WhatsApp Coupon SaaS platform. It supports multi-level revenue tracking for admins (agents) and credit management for merchants.

## Architecture

### System Structure
- **Admin/Agent** → Has wallet → Earns commissions from merchants
- **Merchant** → Has wallet → Pays for WhatsApp messages and features

### Core Components

1. **AdminWallet** - Tracks agent earnings and expenses
2. **MerchantWallet** - Manages merchant credits and subscriptions
3. **WalletTransaction** - Records all financial transactions
4. **CreditPackage** - Defines available credit packages

## Database Schema

### Admin Wallets
```sql
admin_wallets
├── id (PK)
├── admin_id (FK → admins.id, UNIQUE)
├── balance (decimal)
├── total_earnings (decimal)
├── total_spent (decimal)
├── pending_amount (decimal)
├── currency (varchar, default 'MYR')
├── is_active (boolean)
├── created_at
└── updated_at
```

### Merchant Wallets
```sql
merchant_wallets
├── id (PK)
├── merchant_id (FK → merchants.id, UNIQUE)
├── message_credits (int)
├── marketing_credits (int)
├── utility_credits (int)
├── total_credits_purchased (int)
├── total_credits_used (int)
├── subscription_type (varchar: 'annual' | 'temporary')
├── subscription_expires_at (timestamp, nullable)
├── annual_fee_paid (boolean)
├── currency (varchar, default 'MYR')
├── is_active (boolean)
├── created_at
└── updated_at
```

### Wallet Transactions
```sql
wallet_transactions
├── id (PK)
├── admin_wallet_id (FK → admin_wallets.id, nullable)
├── merchant_wallet_id (FK → merchant_wallets.id, nullable)
├── type (varchar: 'credit' | 'debit' | 'commission' | 'refund' | 'purchase')
├── amount (decimal, nullable)
├── credits (int, nullable)
├── credit_type (varchar: 'marketing' | 'utility' | 'general', nullable)
├── transaction_reference (varchar, nullable)
├── status (varchar: 'pending' | 'completed' | 'failed' | 'cancelled')
├── description (text)
├── metadata (JSON string)
├── balance_before (decimal, nullable)
├── balance_after (decimal, nullable)
├── completed_at (timestamp, nullable)
├── created_at
└── updated_at
```

### Credit Packages
```sql
credit_packages
├── id (PK)
├── name (varchar)
├── description (text)
├── credits (int)
├── credit_type (varchar: 'marketing' | 'utility' | 'general')
├── price (decimal)
├── price_per_credit (decimal)
├── currency (varchar)
├── merchant_type (varchar: 'annual' | 'temporary' | 'all', nullable)
├── is_active (boolean)
├── sort_order (int)
├── bonus_credits (int)
├── created_at
└── updated_at
```

## Pricing Structure

### Annual Merchant Fees
| Item | Merchant Pays | Agent Profit | Admin Income |
|------|---------------|--------------|--------------|
| Annual Subscription | RM1199 | RM900 (75%) | RM299 (25%) |

### Message Credits

#### Marketing Messages
- Merchant Price: RM0.50/credit
- Agent Cost: RM0.45/credit
- Admin Cost: RM0.36/credit

#### Utility Messages
- Merchant Price: RM0.15/credit
- Agent Cost: RM0.12/credit
- Admin Cost: RM0.06/credit

#### Temporary Merchants
- Merchant Price: RM0.30/credit
- Agent Cost: RM0.17/credit
- Admin Cost: RM0.06/credit

## API Endpoints

### Wallet Management

#### Get Admin Wallet
```http
GET /wallets/admin/:adminId
Authorization: Bearer {token}
```

Response:
```json
{
  "id": 1,
  "admin_id": 1,
  "balance": 5000.00,
  "total_earnings": 15000.00,
  "total_spent": 10000.00,
  "pending_amount": 500.00,
  "currency": "MYR",
  "is_active": true
}
```

#### Get Merchant Wallet
```http
GET /wallets/merchant/:merchantId
Authorization: Bearer {token}
```

Response:
```json
{
  "id": 1,
  "merchant_id": 1,
  "message_credits": 1500,
  "marketing_credits": 1000,
  "utility_credits": 500,
  "total_credits_purchased": 2000,
  "total_credits_used": 500,
  "subscription_type": "annual",
  "subscription_expires_at": "2026-01-15T00:00:00Z",
  "annual_fee_paid": true,
  "currency": "MYR",
  "is_active": true
}
```

#### Get Transactions
```http
GET /wallets/admin/:adminId/transactions?page=1&limit=20
GET /wallets/merchant/:merchantId/transactions?page=1&limit=20
Authorization: Bearer {token}
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "type": "credit",
      "amount": 900.00,
      "description": "Annual subscription commission",
      "status": "completed",
      "balance_before": 4100.00,
      "balance_after": 5000.00,
      "completed_at": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Add Credits to Merchant
```http
POST /wallets/merchant/:merchantId/add-credits
Authorization: Bearer {token}
Content-Type: application/json

{
  "credits": 1000,
  "credit_type": "marketing",
  "amount": 400.00,
  "description": "Professional Package purchase"
}
```

Response:
```json
{
  "message": "Credits added successfully",
  "data": {
    "id": 123,
    "merchant_wallet_id": 1,
    "type": "purchase",
    "credits": 1000,
    "credit_type": "marketing",
    "amount": 400.00,
    "status": "completed"
  }
}
```

#### Upgrade to Annual Subscription
```http
POST /wallets/merchant/:merchantId/upgrade-to-annual
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1199.00,
  "admin_id": 1
}
```

Response:
```json
{
  "message": "Merchant upgraded to annual subscription",
  "data": {
    "success": true,
    "expires_at": "2026-01-15T00:00:00Z"
  }
}
```

#### Get Credit Packages
```http
GET /wallets/credit-packages?merchant_type=annual
Authorization: Bearer {token}
```

Response:
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
  }
]
```

## Service Methods

### WalletService

#### Wallet Creation
```typescript
// Create admin wallet (called automatically on admin creation)
await walletService.createAdminWallet(adminId, 'MYR');

// Create merchant wallet (called automatically on merchant creation)
await walletService.createMerchantWallet(merchantId, 'annual', 'MYR');
```

#### Admin Wallet Operations
```typescript
// Credit admin wallet (commission earnings)
await walletService.creditAdminWallet(
  adminId,
  900.00,
  'Annual subscription commission from merchant #123',
  { merchant_id: 123, total_amount: 1199.00 }
);

// Debit admin wallet (costs)
await walletService.debitAdminWallet(
  adminId,
  50.00,
  'WhatsApp API cost for batch send',
  { batch_id: 456, messages_sent: 100 }
);
```

#### Merchant Credit Operations
```typescript
// Add credits to merchant
await walletService.addMerchantCredits(
  merchantId,
  1000,                    // credits
  'marketing',             // credit_type
  400.00,                  // amount paid
  'Professional Package',  // description
  { package_id: 3 }        // metadata
);

// Deduct credits (when sending WhatsApp)
await walletService.deductMerchantCredits(
  merchantId,
  1,                       // credits to deduct
  'marketing',             // credit_type
  'Coupon sent via WhatsApp to customer',
  { customer_id: 789, coupon_id: 101 }
);
```

#### Query Operations
```typescript
// Get wallet
const adminWallet = await walletService.getAdminWallet(adminId);
const merchantWallet = await walletService.getMerchantWallet(merchantId);

// Get transactions
const adminTxns = await walletService.getAdminTransactions(adminId, 1, 20);
const merchantTxns = await walletService.getMerchantTransactions(merchantId, 1, 20);

// Get credit packages
const packages = await walletService.getCreditPackages('annual');
```

#### Subscription Management
```typescript
// Upgrade merchant to annual
await walletService.upgradeToAnnual(merchantId, 1199.00, adminId);
```

## Integration Points

### 1. Merchant Creation
When a merchant is created, a wallet is automatically generated:

```typescript
// In merchant.service.ts
const savedMerchant = await queryRunner.manager.save(merchant);

// Auto-create wallet
await this.walletService.createMerchantWallet(
  savedMerchant.id,
  createMerchantDto.merchant_type || 'temporary'
);
```

### 2. Admin Creation
When an admin is created, a wallet is automatically generated:

```typescript
// In admin.service.ts
const savedAdmin = await this.adminRepository.save(admin);

// Auto-create wallet
await this.walletService.createAdminWallet(savedAdmin.id);
```

### 3. WhatsApp Message Sending
When sending WhatsApp messages, credits are deducted:

```typescript
// In whatsapp.service.ts (to be implemented)
// Before sending message
await walletService.deductMerchantCredits(
  merchantId,
  1,  // 1 credit per message
  message_type === 'marketing' ? 'marketing' : 'utility',
  `WhatsApp message sent to ${phone}`,
  { phone, template_id, message_type }
);

// Send message via WhatsApp API
await sendWhatsAppMessage(phone, template);
```

### 4. Annual Subscription
When merchant upgrades to annual:

```typescript
// Charge merchant
const paymentResult = await paymentGateway.charge(merchantId, 1199.00);

if (paymentResult.success) {
  // Upgrade subscription and credit admin
  await walletService.upgradeToAnnual(merchantId, 1199.00, adminId);
}
```

## Default Credit Packages

### Annual Merchants

**Marketing Messages:**
- Starter Package: 100 credits @ RM50.00 (RM0.50/credit)
- Basic Package: 500 credits @ RM225.00 (RM0.45/credit)
- Professional Package: 1000 credits @ RM400.00 (RM0.40/credit)
- Enterprise Package: 5000 credits @ RM1750.00 (RM0.35/credit)

**Utility Messages:**
- Utility Starter: 500 credits @ RM75.00 (RM0.15/credit)
- Utility Basic: 1000 credits @ RM120.00 (RM0.12/credit)
- Utility Pro: 5000 credits @ RM500.00 (RM0.10/credit)

### Temporary Merchants

**General Messages:**
- Temp Starter: 50 credits @ RM15.00 (RM0.30/credit)
- Temp Basic: 100 credits @ RM28.00 (RM0.28/credit)
- Temp Pro: 200 credits @ RM52.00 (RM0.26/credit)

## Transaction Flow Examples

### Example 1: Merchant Purchases Credits

```
1. Merchant pays RM400.00 for Professional Package (1000 marketing credits)
2. Payment gateway confirms payment
3. System calls: addMerchantCredits(merchantId, 1000, 'marketing', 400.00)
4. Transaction created:
   - Type: 'purchase'
   - Credits: +1000
   - Amount: 400.00
   - Status: 'completed'
5. Merchant wallet updated:
   - message_credits: +1000
   - marketing_credits: +1000
   - total_credits_purchased: +1000
```

### Example 2: Merchant Sends WhatsApp Message

```
1. Merchant triggers birthday automation (marketing message)
2. System checks if merchant has marketing_credits >= 1
3. If yes, deduct 1 credit:
   - deductMerchantCredits(merchantId, 1, 'marketing', 'Birthday message to customer')
4. Transaction created:
   - Type: 'debit'
   - Credits: -1
   - Status: 'completed'
5. Merchant wallet updated:
   - message_credits: -1
   - marketing_credits: -1
   - total_credits_used: +1
6. Send WhatsApp message
```

### Example 3: Merchant Upgrades to Annual

```
1. Merchant pays RM1199.00 for annual subscription
2. Payment confirmed
3. System calls: upgradeToAnnual(merchantId, 1199.00, adminId)
4. Merchant wallet updated:
   - subscription_type: 'annual'
   - annual_fee_paid: true
   - subscription_expires_at: +1 year
5. Admin wallet credited with RM900.00 (75% commission)
6. Admin transaction created:
   - Type: 'commission'
   - Amount: +900.00
   - Description: "Annual subscription commission from merchant #X"
   - Status: 'completed'
7. Admin wallet updated:
   - balance: +900.00
   - total_earnings: +900.00
```

## Business Logic

### Credit Types

#### Marketing Messages
- Used for promotional campaigns
- Birthday automation
- Festival automation
- Broadcast messages
- Higher cost (RM0.50 for annual, RM0.30 for temporary)

#### Utility Messages
- Used for transactional notifications
- Coupon delivery after review
- Order confirmations
- Password resets
- Lower cost (RM0.15 for annual)

#### General Messages (Temporary Merchants)
- Combined pool for temporary merchants
- Single rate: RM0.30/credit
- No separation between marketing/utility

### Subscription Types

#### Annual Merchants
- Pay RM1199.00 upfront
- Access to lower credit rates
- Can purchase marketing and utility credits separately
- Can export customer data
- 1-year validity

#### Temporary Merchants
- Free signup
- Pay-as-you-go with higher rates
- Limited batch quantities (100-500)
- No customer data export
- General credits only

## Error Handling

### Insufficient Balance
```typescript
throw new BadRequestException('Insufficient marketing credits');
throw new BadRequestException('Insufficient utility credits');
throw new BadRequestException('Insufficient balance');
```

### Wallet Not Found
```typescript
throw new NotFoundException('Admin wallet not found');
throw new NotFoundException('Merchant wallet not found');
```

### Transaction Failures
All wallet operations use database transactions:
```typescript
try {
  await queryRunner.startTransaction();
  // ... operations
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
}
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Admin Metrics:**
   - Total earnings
   - Total commissions
   - Average monthly revenue
   - Number of merchants

2. **Merchant Metrics:**
   - Total credits purchased
   - Total credits used
   - Credit utilization rate
   - Average message cost

3. **Platform Metrics:**
   - Total transactions
   - Revenue by credit type
   - Most popular packages
   - Conversion rate (temporary → annual)

## Future Enhancements

1. **Auto-reload:** Automatically purchase credits when balance drops below threshold
2. **Bonus Credits:** Promotional bonus credits on bulk purchases
3. **Referral Program:** Earn credits by referring other merchants
4. **Credit Expiration:** Time-limited credits for campaigns
5. **Multi-currency:** Support for USD, SGD, etc.
6. **Payment Integration:** Stripe, PayPal, local gateways
7. **Wallet Statements:** Monthly PDF statements for admins
8. **Tax Invoices:** Automated invoice generation
9. **Credit Gifting:** Transfer credits between merchants
10. **Volume Discounts:** Dynamic pricing based on purchase volume

## Testing

### Unit Tests
```bash
npm run test src/modules/wallets/wallet.service.spec.ts
```

### Integration Tests
```bash
npm run test:e2e src/modules/wallets/wallet.e2e.spec.ts
```

### Manual Testing Checklist

- [ ] Create admin → Verify wallet created
- [ ] Create merchant → Verify wallet created
- [ ] Purchase credits → Verify merchant wallet updated
- [ ] Send message → Verify credits deducted
- [ ] Upgrade to annual → Verify admin commission credited
- [ ] View transactions → Verify pagination works
- [ ] Check credit packages → Verify filtering by merchant_type
- [ ] Test insufficient balance → Verify error thrown
- [ ] Test transaction rollback → Verify atomicity

## Support & Troubleshooting

### Common Issues

**Issue:** Wallet not created after user creation
- **Solution:** Check if WalletModule is imported in Admin/MerchantModule
- **Solution:** Verify WalletService is injected correctly

**Issue:** Credits not deducting
- **Solution:** Ensure correct credit_type is passed ('marketing' vs 'utility')
- **Solution:** Check if wallet has sufficient credits

**Issue:** Commission not credited to admin
- **Solution:** Verify admin_id is correct in upgradeToAnnual call
- **Solution:** Check transaction logs for errors

### Database Queries for Debugging

```sql
-- Check wallet balance
SELECT * FROM merchant_wallets WHERE merchant_id = 1;
SELECT * FROM admin_wallets WHERE admin_id = 1;

-- View recent transactions
SELECT * FROM wallet_transactions 
WHERE merchant_wallet_id = 1 
ORDER BY created_at DESC LIMIT 10;

-- Total credits purchased vs used
SELECT 
  merchant_id,
  message_credits,
  total_credits_purchased,
  total_credits_used,
  (total_credits_purchased - total_credits_used) as remaining
FROM merchant_wallets;

-- Admin earnings
SELECT 
  admin_id,
  balance,
  total_earnings,
  total_spent,
  (total_earnings - total_spent) as net_profit
FROM admin_wallets;
```

## Conclusion

The wallet system provides a robust foundation for managing credits, commissions, and transactions in the multi-tenant SaaS platform. It supports the business model outlined in the technical documentation while maintaining data integrity through transaction-based operations.

For questions or issues, refer to the codebase or contact the development team.
