# Agent Stripe Settings - Testing Guide with Dummy Keys

## Setup Mock Mode

Add this to your `.env` file:

```env
# Stripe Configuration
# Set to true to skip Stripe API validation (for testing with dummy keys)
STRIPE_MOCK_MODE=true
```

**Important**: Restart your NestJS server after adding this variable.

---

## Postman Testing with Dummy Keys

### 1. Save Agent Stripe Settings (Dummy Keys)

**Endpoint**: `POST http://localhost:8000/agent/stripe-settings`

**Headers**:
```
Authorization: Bearer <YOUR_AGENT_TOKEN>
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "stripePublishableKey": "pk_test_51NabcXYZ123456789",
  "stripeSecretKey": "sk_test_51NabcXYZ123456789",
  "stripeWebhookSecret": "whsec_abc123xyz456"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Stripe settings updated successfully",
  "publishableKey": "pk_test_51NabcXYZ123456789"
}
```

**Console Output**:
```
⚠️  STRIPE_MOCK_MODE is enabled - Skipping Stripe API validation
```

---

### 2. Get Agent Stripe Settings

**Endpoint**: `GET http://localhost:8000/agent/stripe-settings`

**Headers**:
```
Authorization: Bearer <YOUR_AGENT_TOKEN>
```

**Expected Response** (200 OK):
```json
{
  "publishableKey": "pk_test_51NabcXYZ123456789",
  "hasSecretKey": true,
  "hasWebhookSecret": true
}
```

---

### 3. Create Payment Intent (Dummy Mode)

**Endpoint**: `POST http://localhost:8000/stripe/create-payment-intent`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "amount": 5000,
  "merchant_id": 1,
  "package_id": 1,
  "currency": "usd"
}
```

**Expected Response** (200 OK):
```json
{
  "clientSecret": "pi_mock_xxxxxxxxxxxxxxxxx",
  "publishableKey": "pk_test_51NabcXYZ123456789"
}
```

**Note**: In mock mode, the actual Stripe API call will still fail, but you can test the key retrieval and encryption flow.

---

### 4. Create Checkout Session (Dummy Mode)

**Endpoint**: `POST http://localhost:8000/stripe/create-checkout-session`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "amount": 9900,
  "merchant_id": 1,
  "package_id": 2,
  "currency": "usd"
}
```

---

## Important Notes

### Mock Mode Limitations
- ✅ **Works**: Saving and retrieving Stripe keys
- ✅ **Works**: Encryption/decryption of keys
- ✅ **Works**: Key validation format
- ❌ **Doesn't Work**: Actual Stripe API calls (PaymentIntent, Checkout Session)
- ❌ **Doesn't Work**: Real payment processing

### For Full Testing
To test actual payment flows, you need:
1. Real Stripe test keys from https://dashboard.stripe.com/test/apikeys
2. Set `STRIPE_MOCK_MODE=false` in `.env`
3. Use real keys in your Postman requests

### Security Warning
⚠️ **NEVER** set `STRIPE_MOCK_MODE=true` in production! This is for development/testing only.

---

## Testing Checklist

- [ ] Add `STRIPE_MOCK_MODE=true` to `.env`
- [ ] Restart NestJS server
- [ ] Login as Agent to get Bearer token
- [ ] Save dummy Stripe keys via POST `/agent/stripe-settings`
- [ ] Verify keys are encrypted in database
- [ ] Retrieve settings via GET `/agent/stripe-settings`
- [ ] Test that secret keys are never returned in GET response
- [ ] Create a merchant under this agent
- [ ] Test payment intent creation with `merchant_id`
- [ ] Verify correct publishable key is returned

---

## Database Verification

Check that keys are encrypted in the database:

```sql
SELECT 
  id,
  admin_id,
  publishable_key,
  LEFT(secret_key, 20) as encrypted_secret_preview,
  LEFT(webhook_secret, 20) as encrypted_webhook_preview,
  created_at
FROM agent_stripe_settings;
```

The `secret_key` and `webhook_secret` columns should contain encrypted data, NOT the plain text keys.
