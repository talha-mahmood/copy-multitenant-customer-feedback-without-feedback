# WhatsApp Integration Documentation

## Overview

This project integrates WhatsApp Business API to send notifications, OTPs, coupons, feedback reminders, and prize notifications to users. The integration uses the Meta (Facebook) Graph API to send template messages and text messages.

## Features

1. **OTP Messages** - Send verification codes for authentication
2. **Welcome Messages** - Greet new users upon registration
3. **Coupon Notifications** - Notify customers about new coupons with QR codes
4. **Feedback Reminders** - Remind customers to submit feedback
5. **Prize Notifications** - Notify lucky draw winners
6. **Custom Text Messages** - Send any custom message
7. **Document Sharing** - Send PDFs, invoices, receipts, etc.

## Architecture

### Files Structure

```
src/
├── common/
│   ├── helpers/
│   │   └── cache-busting.util.ts    # Cache busting for PDF delivery
│   └── services/
│       └── whatsapp.service.ts      # Main WhatsApp service
└── modules/
    └── whatsapp/
        └── whatsapp.module.ts       # Global WhatsApp module
```

### Module Architecture

The `WhatsAppModule` is a **Global Module**, meaning it's available throughout the entire application without needing to import it in every module.

```typescript
@Global()
@Module({
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL="https://graph.facebook.com/v22.0"
WHATSAPP_TOKEN="your_whatsapp_business_api_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_webhook_verify_token"
```

### Getting WhatsApp Business API Credentials

1. **Create a Meta Business Account**
   - Go to https://business.facebook.com
   - Create a business account

2. **Set up WhatsApp Business API**
   - Navigate to Meta for Developers (https://developers.facebook.com)
   - Create a new app or select existing app
   - Add WhatsApp product to your app

3. **Get Credentials**
   - `WHATSAPP_TOKEN`: Temporary token from the WhatsApp Business API Dashboard (generate a permanent token for production)
   - `WHATSAPP_PHONE_NUMBER_ID`: Found in WhatsApp > API Setup section
   - `WHATSAPP_API_URL`: https://graph.facebook.com/v22.0 (or latest version)

4. **Verify Phone Number**
   - Verify your business phone number in the WhatsApp Business API dashboard

## Usage

### Injecting WhatsApp Service

Since `WhatsAppModule` is global, you can inject `WhatsAppService` directly in any service:

```typescript
import { Injectable } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class YourService {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  async someMethod() {
    // Use WhatsApp service methods
  }
}
```

### Available Methods

#### 1. Send OTP Message

```typescript
const result = await this.whatsAppService.sendOTPMessage(
  '+923001234567',  // Phone number (auto-formats Pakistani numbers)
  '123456'          // OTP code
);

if (result.success) {
  console.log('OTP sent! Message ID:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

**Notes:**
- Uses WhatsApp template `login_otp` (must be approved by Meta)
- Falls back to plain text if template fails
- Auto-formats Pakistani numbers (0xxx → +92xxx)

#### 2. Send Welcome Message

```typescript
const result = await this.whatsAppService.sendWelcomeMessage(
  '+923001234567',
  'John'  // Customer's first name
);
```

#### 3. Send Coupon Notification

```typescript
const result = await this.whatsAppService.sendCouponNotification(
  '+923001234567',
  'John Doe',          // Customer name
  'SAVE20',            // Coupon code
  'ABC Restaurant',    // Merchant name
  'https://example.com/qr/SAVE20.png'  // QR code URL
);
```

#### 4. Send Feedback Reminder

```typescript
const result = await this.whatsAppService.sendFeedbackReminder(
  '+923001234567',
  'John Doe',
  'ABC Restaurant',
  'https://example.com/feedback/123'  // Feedback form link
);
```

#### 5. Send Prize Notification

```typescript
const result = await this.whatsAppService.sendPrizeWonNotification(
  '+923001234567',
  'John Doe',
  'Free Coffee',                      // Prize name
  'Valid for 7 days at any location'  // Prize details
);
```

#### 6. Send Custom Text Message

```typescript
const result = await this.whatsAppService.sendTextMessage(
  '+923001234567',
  'Your custom message here'
);
```

#### 7. Send Document (PDF, Invoice, etc.)

```typescript
const result = await this.whatsAppService.sendDocument(
  '+923001234567',
  'https://example.com/invoices/INV-001.pdf',  // Document URL
  'Invoice-001.pdf',                            // Filename
  'Your invoice for January 2026'               // Optional caption
);
```

**Notes:**
- Automatically applies cache-busting to prevent WhatsApp from serving cached PDFs
- Supports PDFs, DOCX, XLSX, and other document types

## Phone Number Formatting

The service automatically formats phone numbers:

- `03001234567` → `+923001234567` (Pakistani local)
- `3001234567` → `+923001234567` (10 digits without 0)
- `+923001234567` → `+923001234567` (already formatted)
- Other countries: Adds `+` if missing

## Integration Examples

### Example 1: Send OTP during Login/Registration

**File:** `src/modules/auth/auth.service.ts`

```typescript
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async sendOTP(phoneNumber: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database or cache
    // ... your OTP storage logic
    
    // Send via WhatsApp
    const result = await this.whatsAppService.sendOTPMessage(
      phoneNumber,
      otpCode
    );
    
    if (!result.success) {
      this.logger.error('Failed to send OTP via WhatsApp:', result.error);
      // Fallback to SMS or email
    }
    
    return { success: result.success };
  }
}
```

### Example 2: Send Coupon after Creation

**File:** `src/modules/coupons/coupon.service.ts`

```typescript
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class CouponService {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async createCoupon(createCouponDto: CreateCouponDto) {
    // Create coupon
    const coupon = await this.couponRepository.save(createCouponDto);
    
    // Send WhatsApp notification to customer
    if (coupon.customer?.phone) {
      await this.whatsAppService.sendCouponNotification(
        coupon.customer.phone,
        coupon.customer.name,
        coupon.code,
        coupon.merchant.name,
        coupon.qr_code_url
      );
    }
    
    return coupon;
  }
}
```

### Example 3: Send Prize Notification after Lucky Draw

**File:** `src/modules/lucky-draw/lucky-draw.service.ts`

```typescript
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class LuckyDrawService {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async claimPrize(resultId: number, customerId: number) {
    const result = await this.luckyDrawResultRepository.findOne({
      where: { id: resultId },
      relations: ['customer', 'prize'],
    });
    
    // Mark as claimed
    result.is_claimed = true;
    result.claimed_at = new Date();
    await this.luckyDrawResultRepository.save(result);
    
    // Send WhatsApp notification
    if (result.customer?.phone) {
      await this.whatsAppService.sendPrizeWonNotification(
        result.customer.phone,
        result.customer.name,
        result.prize.prize_name,
        `Prize value: ${result.prize.prize_value}. Claim before expiry.`
      );
    }
    
    return result;
  }
}
```

### Example 4: Send Feedback Reminder

**File:** `src/modules/feedbacks/feedback.service.ts`

```typescript
import { WhatsAppService } from '../../common/services/whatsapp.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async sendFeedbackReminder(customerId: number, merchantId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId }
    });
    
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId }
    });
    
    const feedbackLink = `${process.env.APP_FRONTEND_URL}/feedback/${merchantId}?customer=${customerId}`;
    
    if (customer?.phone) {
      await this.whatsAppService.sendFeedbackReminder(
        customer.phone,
        customer.name,
        merchant.business_name,
        feedbackLink
      );
    }
  }
}
```

## WhatsApp Templates

To use template messages (like `login_otp`), you need to:

1. **Create Templates in Meta Business Suite**
   - Go to WhatsApp Manager
   - Navigate to Message Templates
   - Create a new template

2. **Template Example: `login_otp`**

   Template Name: `login_otp`
   
   Category: `AUTHENTICATION`
   
   Language: `English`
   
   Body:
   ```
   🔐 Your verification code is: {{1}}
   
   This code will expire in 5 minutes.
   
   ⚠️ Do not share this code with anyone.
   ```
   
   Button: `Copy Code` (URL with dynamic suffix `{{1}}`)

3. **Wait for Approval**
   - Meta reviews templates (usually 24-48 hours)
   - Only approved templates can be used

4. **Fallback Mechanism**
   - If template fails, service automatically falls back to plain text messages

## Error Handling

All methods return a `SendMessageResult` object:

```typescript
interface SendMessageResult {
  success: boolean;
  messageId?: string;  // WhatsApp message ID if successful
  error?: string;      // Error message if failed
}
```

### Handling Errors

```typescript
const result = await this.whatsAppService.sendOTPMessage(phone, otp);

if (!result.success) {
  // Log error
  this.logger.error('WhatsApp failed:', result.error);
  
  // Fallback to SMS or email
  await this.smsService.sendOTP(phone, otp);
}
```

## Cache Busting for PDFs

When sending documents via WhatsApp, the `CacheBustingUtil` prevents WhatsApp from serving cached versions:

```typescript
// Automatic cache busting
const result = await this.whatsAppService.sendDocument(
  phone,
  'https://example.com/invoice.pdf',  // Original URL
  'invoice.pdf'
);

// URL becomes: https://example.com/invoice.pdf?v=1234567890&r=abc123&h=xyz...
```

This ensures customers always receive the latest version of documents.

## Testing

### Test WhatsApp Integration

1. **Set up a test phone number**
   - Add your phone number to the WhatsApp Business API sandbox
   - Follow verification steps in Meta Business Suite

2. **Test OTP sending:**

```typescript
// In a controller or test file
@Get('test-whatsapp')
async testWhatsApp() {
  const result = await this.whatsAppService.sendOTPMessage(
    '+923001234567',  // Your test number
    '123456'
  );
  
  return result;
}
```

3. **Monitor logs:**
   - Check NestJS console for `WhatsAppService` logs
   - Verify message delivery in WhatsApp Business API dashboard

## Production Checklist

- [ ] Generate permanent access token (temporary tokens expire in 24 hours)
- [ ] Set up webhook for message status updates
- [ ] Create and get approval for all required message templates
- [ ] Configure business verification with Meta
- [ ] Test with multiple phone numbers
- [ ] Set up monitoring and alerting for failed messages
- [ ] Implement rate limiting to avoid API throttling
- [ ] Store message delivery status in database
- [ ] Set up fallback mechanisms (SMS, email)

## Limitations & Best Practices

1. **Rate Limits**
   - WhatsApp has rate limits based on your business tier
   - Start with 1,000 messages/day, scales with usage
   - Implement queue system for high-volume sending

2. **Template Messages**
   - Required for first message to user (24-hour window)
   - After user replies, you have 24-hour session window
   - Templates need Meta approval

3. **Phone Number Format**
   - Always include country code
   - Remove spaces and special characters
   - Service handles formatting automatically

4. **Message Length**
   - Keep messages concise
   - WhatsApp has character limits (varies by message type)

5. **Document Sending**
   - Max file size: 100MB
   - Supported formats: PDF, DOC, DOCX, XLS, XLSX, etc.
   - URLs must be publicly accessible

## Support & Resources

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)

## Troubleshooting

### Issue: Messages not sending

1. Check environment variables are set correctly
2. Verify phone number is in correct format
3. Check Meta Business Suite for API status
4. Verify access token is valid
5. Check template approval status

### Issue: Template not found error

- Ensure template is approved in Meta Business Suite
- Check template name matches exactly (case-sensitive)
- Verify language code is correct

### Issue: Document not loading

- Verify URL is publicly accessible
- Check file size is under 100MB
- Try with cache-busting disabled to test

### Issue: Phone number format error

- Service auto-formats, but double-check country code
- Remove any non-numeric characters except `+`

## Future Enhancements

- [ ] Add webhook handler for message status updates
- [ ] Implement message queue for high-volume sending
- [ ] Add message analytics and tracking
- [ ] Create admin dashboard for message monitoring
- [ ] Add support for media messages (images, videos)
- [ ] Implement interactive messages (buttons, lists)
- [ ] Add message scheduling functionality
- [ ] Create message templates management interface
