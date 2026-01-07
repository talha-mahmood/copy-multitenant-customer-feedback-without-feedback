import { Controller, Post, Body } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  /**
   * Test endpoint to send general message template
   * Example: POST /api/v1/whatsapp/send-general-message
   * Body: { "phoneNumber": "+923001234567", "message": "یہ ایک ٹیسٹ پیغام ہے" }
   */
  @Public()
  @Post('send-general-message')
  async sendGeneralMessage(
    @Body('phoneNumber') phoneNumber: string,
    @Body('message') message: string,
  ) {
    const result = await this.whatsAppService.sendGeneralMessage(
      phoneNumber,
      message,
    );

    return {
      success: result.success,
      message: result.success
        ? 'General message sent successfully'
        : 'Failed to send general message',
      messageId: result.messageId,
      error: result.error,
    };
  }
}
