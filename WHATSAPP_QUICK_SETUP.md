# WhatsApp Integration - Quick Setup Guide

## Step 1: Update Environment Variables

Add your WhatsApp credentials to `.env`:

```bash
WHATSAPP_API_URL="https://graph.facebook.com/v22.0"
WHATSAPP_TOKEN="your_token_here"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_verify_token"
```

## Step 2: Get WhatsApp Business API Credentials

1. Go to https://business.facebook.com
2. Create or select your business
3. Go to https://developers.facebook.com
4. Create a new app or select existing
5. Add "WhatsApp" product
6. Navigate to WhatsApp > API Setup
7. Copy:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary Token** → `WHATSAPP_TOKEN` (generate permanent token for production)

## Step 3: Test the Integration

### Option 1: Using Postman

1. Open the Postman collection
2. Navigate to "WhatsApp" folder
3. Update phone number in request body to your test number
4. Send "Send OTP" request

### Option 2: Using cURL

```bash
# Test health check
curl http://localhost:8000/api/v1/whatsapp/health

# Send test OTP
curl -X POST http://localhost:8000/api/v1/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+923001234567", "otpCode": "123456"}'
```

## Step 4: Use in Your Code

Inject `WhatsAppService` in any service:

```typescript
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class YourService {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  async sendNotification() {
    const result = await this.whatsAppService.sendTextMessage(
      '+923001234567',
      'Hello from WhatsApp!'
    );
    
    if (result.success) {
      console.log('Message sent!', result.messageId);
    }
  }
}
```

## Available Methods

```typescript
// 1. Send OTP
await whatsAppService.sendOTPMessage(phone, otpCode);

// 2. Send welcome message
await whatsAppService.sendWelcomeMessage(phone, firstName);

// 3. Send coupon notification
await whatsAppService.sendCouponNotification(phone, name, code, merchant, qrUrl);

// 4. Send feedback reminder
await whatsAppService.sendFeedbackReminder(phone, name, merchant, link);

// 5. Send prize notification
await whatsAppService.sendPrizeWonNotification(phone, name, prize, details);

// 6. Send custom text
await whatsAppService.sendTextMessage(phone, message);

// 7. Send document
await whatsAppService.sendDocument(phone, url, filename, caption);
```

## That's It!

Your WhatsApp integration is ready to use. Check the full documentation in [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)
