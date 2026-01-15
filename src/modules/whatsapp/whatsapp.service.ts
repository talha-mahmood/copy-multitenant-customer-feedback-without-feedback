import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WhatsAppTemplateMessage {
  messaging_product: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters: Array<{ type: 'text'; text: string }>;
    }>;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(private configService: ConfigService) {
    this.apiUrl =
      this.configService.get<string>('WHATSAPP_API_URL')?.replace(/"/g, '') ||
      '';
    this.token = this.configService.get<string>('WHATSAPP_TOKEN') || '';
    this.phoneNumberId =
      this.configService
        .get<string>('WHATSAPP_PHONE_NUMBER_ID')
        ?.replace(/"/g, '') || '';
  }

  /**
   * Format phone number to international format
   * Converts Pakistani local numbers (0xxx) to international (+92xxx)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Handle Pakistani numbers specifically
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '+92' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 10 && !cleanNumber.startsWith('+')) {
      cleanNumber = '+92' + cleanNumber;
    } else if (!cleanNumber.startsWith('+')) {
      cleanNumber = '+' + cleanNumber;
    }

    return cleanNumber;
  }

  /**
   * Send general message using WhatsApp Template
   * Template: general_message (with 1 parameter for custom message)
   */
  async sendGeneralMessage(
    phoneNumber: string,
    message: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const templateMessage: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'template',
        template: {
          name: 'general_message',
          language: { code: 'ur' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: message,
                },
              ],
            },
          ],
        },
      };

      return await this.sendTemplate(formattedPhoneNumber, templateMessage);
    } catch (error) {
      this.logger.error('Error sending general message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send coupon delivery message with coupon details
   * Template: coupon_delivery
   */
  async sendCouponDelivery(
    phoneNumber: string,
    customerName: string,
    merchantName: string,
    couponCode: string,
    expiryDate: string,
    merchantAddress: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const templateMessage: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'template',
        template: {
          name: 'coupon_delivery',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName },
                { type: 'text', text: merchantName },
                { type: 'text', text: couponCode },
                { type: 'text', text: expiryDate },
                { type: 'text', text: merchantAddress },
              ],
            },
          ],
        },
      };

      return await this.sendTemplate(formattedPhoneNumber, templateMessage);
    } catch (error) {
      this.logger.error('Error sending coupon delivery:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Private helper method to send WhatsApp template
   */
  private async sendTemplate(
    formattedPhoneNumber: string,
    templateMessage: WhatsAppTemplateMessage,
  ): Promise<SendMessageResult> {
    try {
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateMessage),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Template ${templateMessage.template.name} sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error(
          `Failed to send template ${templateMessage.template.name}:`,
          result,
        );
        return {
          success: false,
          error:
            (result as any).error?.message ||
            `Failed to send template ${templateMessage.template.name}`,
        };
      }
    } catch (error) {
      this.logger.error('Error sending WhatsApp template:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }
}
