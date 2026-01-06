import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  /**
   * Test endpoint to send OTP via WhatsApp
   * Example: POST /api/v1/whatsapp/send-otp
   * Body: { "phoneNumber": "+923001234567", "otpCode": "123456" }
   */
  @Public()
  @Post('send-otp')
  async sendOTP(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otpCode') otpCode: string,
  ) {
    const result = await this.whatsAppService.sendOTPMessage(
      phoneNumber,
      otpCode,
    );

    return {
      success: result.success,
      message: result.success
        ? 'OTP sent successfully via WhatsApp'
        : 'Failed to send OTP',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send welcome message
   * Example: POST /api/v1/whatsapp/send-welcome
   * Body: { "phoneNumber": "+923001234567", "firstName": "John" }
   */
  @Public()
  @Post('send-welcome')
  async sendWelcome(
    @Body('phoneNumber') phoneNumber: string,
    @Body('firstName') firstName: string,
  ) {
    const result = await this.whatsAppService.sendWelcomeMessagee(
      phoneNumber,
      firstName,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Welcome message sent successfully'
        : 'Failed to send welcome message',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send coupon notification
   * Example: POST /api/v1/whatsapp/send-coupon
   * Body: {
   *   "phoneNumber": "+923001234567",
   *   "customerName": "John Doe",
   *   "couponCode": "SAVE20",
   *   "merchantName": "ABC Restaurant",
   *   "qrCodeUrl": "https://example.com/qr/SAVE20.png"
   * }
   */
  @Public()
  @Post('send-coupon')
  async sendCoupon(
    @Body('phoneNumber') phoneNumber: string,
    @Body('customerName') customerName: string,
    @Body('couponCode') couponCode: string,
    @Body('merchantName') merchantName: string,
    @Body('qrCodeUrl') qrCodeUrl: string,
  ) {
    const result = await this.whatsAppService.sendCouponNotification(
      phoneNumber,
      customerName,
      couponCode,
      merchantName,
      qrCodeUrl,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Coupon notification sent successfully'
        : 'Failed to send coupon notification',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send custom text message
   * Example: POST /api/v1/whatsapp/send-text
   * Body: { "phoneNumber": "+923001234567", "message": "Your custom message" }
   */
  @Public()
  @Post('send-text')
  async sendText(
    @Body('phoneNumber') phoneNumber: string,
    @Body('message') message: string,
  ) {
    const result = await this.whatsAppService.sendTextMessage(
      phoneNumber,
      message,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Text message sent successfully'
        : 'Failed to send text message',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send feedback reminder
   * Example: POST /api/v1/whatsapp/send-feedback-reminder
   * Body: {
   *   "phoneNumber": "+923001234567",
   *   "customerName": "John Doe",
   *   "merchantName": "ABC Restaurant",
   *   "feedbackLink": "https://example.com/feedback/123"
   * }
   */
  @Public()
  @Post('send-feedback-reminder')
  async sendFeedbackReminder(
    @Body('phoneNumber') phoneNumber: string,
    @Body('customerName') customerName: string,
    @Body('merchantName') merchantName: string,
    @Body('feedbackLink') feedbackLink: string,
  ) {
    const result = await this.whatsAppService.sendFeedbackReminder(
      phoneNumber,
      customerName,
      merchantName,
      feedbackLink,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Feedback reminder sent successfully'
        : 'Failed to send feedback reminder',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send prize notification
   * Example: POST /api/v1/whatsapp/send-prize
   * Body: {
   *   "phoneNumber": "+923001234567",
   *   "customerName": "John Doe",
   *   "prizeName": "Free Coffee",
   *   "prizeDetails": "Valid for 7 days at any location"
   * }
   */
  @Public()
  @Post('send-prize')
  async sendPrize(
    @Body('phoneNumber') phoneNumber: string,
    @Body('customerName') customerName: string,
    @Body('prizeName') prizeName: string,
    @Body('prizeDetails') prizeDetails: string,
  ) {
    const result = await this.whatsAppService.sendPrizeWonNotification(
      phoneNumber,
      customerName,
      prizeName,
      prizeDetails,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Prize notification sent successfully'
        : 'Failed to send prize notification',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Test endpoint to send document
   * Example: POST /api/v1/whatsapp/send-document
   * Body: {
   *   "phoneNumber": "+923001234567",
   *   "documentUrl": "https://example.com/invoice.pdf",
   *   "filename": "invoice.pdf",
   *   "caption": "Your invoice for January 2026"
   * }
   */
  @Public()
  @Post('send-document')
  async sendDocument(
    @Body('phoneNumber') phoneNumber: string,
    @Body('documentUrl') documentUrl: string,
    @Body('filename') filename: string,
    @Body('caption') caption?: string,
  ) {
    const result = await this.whatsAppService.sendDocument(
      phoneNumber,
      documentUrl,
      filename,
      caption,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Document sent successfully'
        : 'Failed to send document',
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Health check endpoint
   * Example: GET /api/v1/whatsapp/health
   */
  @Public()
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'WhatsApp Integration',
      timestamp: new Date().toISOString(),
    };
  }
}
