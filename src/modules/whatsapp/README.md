# WhatsApp Module

This module provides WhatsApp Business API integration for sending notifications, OTPs, and messages to customers.

## Quick Start

1. **Set environment variables in `.env`:**
```bash
WHATSAPP_API_URL="https://graph.facebook.com/v22.0"
WHATSAPP_TOKEN="your_token_here"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_verify_token"
```

2. **The module is globally available** - just inject `WhatsAppService` in any service:
```typescript
constructor(private readonly whatsAppService: WhatsAppService) {}
```

3. **Test the integration:**
```bash
# Send a test OTP
curl -X POST http://localhost:8000/api/v1/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+923001234567", "otpCode": "123456"}'
```

## API Endpoints

All endpoints are public for testing purposes. Remove `@Public()` decorator in production.

### POST /whatsapp/send-otp
Send OTP verification code
```json
{
  "phoneNumber": "+923001234567",
  "otpCode": "123456"
}
```

### POST /whatsapp/send-welcome
Send welcome message to new user
```json
{
  "phoneNumber": "+923001234567",
  "firstName": "John"
}
```

### POST /whatsapp/send-coupon
Send coupon notification
```json
{
  "phoneNumber": "+923001234567",
  "customerName": "John Doe",
  "couponCode": "SAVE20",
  "merchantName": "ABC Restaurant",
  "qrCodeUrl": "https://example.com/qr/SAVE20.png"
}
```

### POST /whatsapp/send-text
Send custom text message
```json
{
  "phoneNumber": "+923001234567",
  "message": "Your custom message here"
}
```

### POST /whatsapp/send-feedback-reminder
Send feedback reminder
```json
{
  "phoneNumber": "+923001234567",
  "customerName": "John Doe",
  "merchantName": "ABC Restaurant",
  "feedbackLink": "https://example.com/feedback/123"
}
```

### POST /whatsapp/send-prize
Send prize won notification
```json
{
  "phoneNumber": "+923001234567",
  "customerName": "John Doe",
  "prizeName": "Free Coffee",
  "prizeDetails": "Valid for 7 days"
}
```

### POST /whatsapp/send-document
Send document (PDF, invoice, etc.)
```json
{
  "phoneNumber": "+923001234567",
  "documentUrl": "https://example.com/invoice.pdf",
  "filename": "invoice.pdf",
  "caption": "Your invoice"
}
```

### GET /whatsapp/health
Health check endpoint
```
GET http://localhost:8000/api/v1/whatsapp/health
```

## Usage in Your Services

### Example 1: Send OTP during authentication
```typescript
@Injectable()
export class AuthService {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  async sendLoginOTP(phoneNumber: string) {
    const otp = this.generateOTP();
    const result = await this.whatsAppService.sendOTPMessage(phoneNumber, otp);
    return result;
  }
}
```

### Example 2: Notify customer about new coupon
```typescript
@Injectable()
export class CouponService {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  async notifyCustomer(coupon: Coupon) {
    await this.whatsAppService.sendCouponNotification(
      coupon.customer.phone,
      coupon.customer.name,
      coupon.code,
      coupon.merchant.name,
      coupon.qr_code_url
    );
  }
}
```

### Example 3: Send prize notification
```typescript
@Injectable()
export class LuckyDrawService {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  async notifyWinner(result: LuckyDrawResult) {
    await this.whatsAppService.sendPrizeWonNotification(
      result.customer.phone,
      result.customer.name,
      result.prize.prize_name,
      `Prize: ${result.prize.prize_value}`
    );
  }
}
```

## Phone Number Formatting

The service automatically handles Pakistani phone numbers:
- `03001234567` → `+923001234567`
- `3001234567` → `+923001234567`
- `+923001234567` → `+923001234567` (no change)

## Documentation

For complete documentation, see: [WHATSAPP_INTEGRATION.md](../../WHATSAPP_INTEGRATION.md)

## Support

For issues or questions, refer to:
- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
