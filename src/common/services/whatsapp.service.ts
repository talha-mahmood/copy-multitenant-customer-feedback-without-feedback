import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheBustingUtil } from '../helpers/cache-busting.util';

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
      sub_type?: string;
      index?: number;
      parameters: Array<
        | { type: 'text'; text: string }
        | { type: 'document'; document: { link: string; filename: string } }
      >;
    }>;
  };
}

interface WhatsAppTextMessage {
  messaging_product: string;
  to: string;
  type: string;
  text: {
    body: string;
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




  async sendWelcomeMessagee(phoneNumber: string, firstName: string): Promise<any> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      const message: WhatsAppTextMessage = {
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: "text",
        text: {
          body: `🎉 Welcome to M-Care, ${firstName}!\n\nYour account has been successfully created. You can now book appointments and manage your healthcare needs through our platform.\n\nThank you for choosing M-Care! 🏥`
        }
      };

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const result: WhatsAppResponse = await response.json();
      
      if (response.ok && result.messages && result.messages.length > 0) {
        return {
          success: true,
          messageId: result.messages[0].id
        };
      } else {
        return {
          success: false,
          error: (result as any).error?.message || 'Failed to send welcome message'
        };
      }
    } catch (error) {
      this.logger.error('Error sending welcome message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  async sendAppointmentBookedMessage(
    phoneNumber: string,
    invoiceLink: string,
    patientName: string,
    formattedDate: string,
    formattedTime: string,
    practitionerName: string,
    appointmentType: string
  ): Promise<any> {
    try {
      // Remove "Dr." or "Dr " from practitioner name
      practitionerName = practitionerName.replace(/^\s*Dr\.?\s*/i, '').trim();
      const FRONTEND_URL="http://localhost:3000";


      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      // Remove base URL from invoice link for button
      const baseUrl = `${FRONTEND_URL}/`;
      let buttonInvoiceLink = invoiceLink;
      if (invoiceLink.startsWith(baseUrl)) {
        buttonInvoiceLink = invoiceLink.replace(baseUrl, "");
      }

      const templateMessage: WhatsAppTemplateMessage = {
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: "template",
        template: {
          name: "appointment_booked",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: patientName || 'Patient' },
                { type: "text", text: formattedDate || 'Date' },
                { type: "text", text: formattedTime || 'Time' },
                { type: "text", text: practitionerName || 'Practitioner' },
                { type: "text", text: invoiceLink || 'Invoice Link' },
                { type: "text", text: appointmentType || 'Appointment Type' }
              ]
            },
            {
              type: "button",
              sub_type: "url",
              index: 0,
              parameters: [
                { type: "text", text: buttonInvoiceLink }
              ]
            }
          ]
        }
      };

      this.logger.log(`Sending appointment booked template to ${formattedPhoneNumber}`);

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateMessage)
      });

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(`Appointment booked template sent successfully. Message ID: ${result.messages[0].id}`);
        return {
          success: true,
          messageId: result.messages[0].id
        };
      } else {
        this.logger.error('Failed to send WhatsApp appointment booked template:', result);
        return {
          success: false,
          error: (result as any).error?.message || 'Failed to send appointment booked message'
        };
      }
    } catch (error) {
      this.logger.error('Error sending WhatsApp appointment booked message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
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
   * Send OTP using WhatsApp Template (Production recommended approach)
   */
  async sendOTPMessage(
    phoneNumber: string,
    otpCode: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const templateMessage: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'template',
        template: {
          name: 'login_otp',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otpCode,
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: otpCode,
                },
              ],
            },
          ],
        },
      };

      this.logger.log(`Sending OTP template to ${formattedPhoneNumber}`);

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
          `OTP template sent successfully. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send WhatsApp template:', result);
        // Fallback to text message if template fails
        return await this.sendOTPTextMessage(formattedPhoneNumber, otpCode);
      }
    } catch (error) {
      this.logger.error('Error sending WhatsApp OTP template:', error);
      // Fallback to text message if template fails
      try {
        const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
        return await this.sendOTPTextMessage(formattedPhoneNumber, otpCode);
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message || 'Network error occurred',
        };
      }
    }
  }

  /**
   * Fallback method: Send OTP as plain text message
   * Used when template is not available or fails
   */
  private async sendOTPTextMessage(
    phoneNumber: string,
    otpCode: string,
  ): Promise<SendMessageResult> {
    try {
      const textMessage: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: `🔐 *Verification Code*\n\nYour verification code is: *${otpCode}*\n\nThis code will expire in 5 minutes.\n\n⚠️ Do not share this code with anyone for your security.`,
        },
      };

      this.logger.log(
        `Sending OTP text message to ${phoneNumber} (template fallback)`,
      );

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textMessage),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `OTP text message sent successfully. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send WhatsApp text message:', result);
        return {
          success: false,
          error: (result as any).error?.message || 'Failed to send message',
        };
      }
    } catch (error) {
      this.logger.error('Error sending WhatsApp text message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send welcome message to new user
   */
  async sendWelcomeMessage(
    phoneNumber: string,
    firstName: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const message: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: `🎉 Welcome ${firstName}!\n\nYour account has been successfully created. Thank you for joining us! 🚀`,
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        return {
          success: false,
          error:
            (result as any).error?.message || 'Failed to send welcome message',
        };
      }
    } catch (error) {
      this.logger.error('Error sending welcome message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send coupon notification with QR code
   */
  async sendCouponNotification(
    phoneNumber: string,
    customerName: string,
    couponCode: string,
    merchantName: string,
    qrCodeUrl: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const message: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: `🎁 *New Coupon Available!*\n\nHi ${customerName},\n\nYou've received a new coupon from *${merchantName}*!\n\n📋 Coupon Code: *${couponCode}*\n🔗 QR Code: ${qrCodeUrl}\n\nShow this coupon at checkout to redeem.\n\nThank you! 🙏`,
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Coupon notification sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send coupon notification:', result);
        return {
          success: false,
          error:
            (result as any).error?.message ||
            'Failed to send coupon notification',
        };
      }
    } catch (error) {
      this.logger.error('Error sending coupon notification:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send feedback reminder to customer
   */
  async sendFeedbackReminder(
    phoneNumber: string,
    customerName: string,
    merchantName: string,
    feedbackLink: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const message: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: `👋 Hi ${customerName},\n\nThank you for visiting *${merchantName}*!\n\nWe'd love to hear about your experience. Please take a moment to share your feedback:\n\n🔗 ${feedbackLink}\n\nYour feedback helps us improve! 💬`,
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Feedback reminder sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send feedback reminder:', result);
        return {
          success: false,
          error:
            (result as any).error?.message ||
            'Failed to send feedback reminder',
        };
      }
    } catch (error) {
      this.logger.error('Error sending feedback reminder:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send prize won notification for lucky draw
   */
  async sendPrizeWonNotification(
    phoneNumber: string,
    customerName: string,
    prizeName: string,
    prizeDetails: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const message: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: `🎊 *Congratulations ${customerName}!*\n\nYou've won: *${prizeName}*\n\n${prizeDetails}\n\nClaim your prize at your earliest convenience.\n\nThank you for participating! 🎉`,
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Prize notification sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send prize notification:', result);
        return {
          success: false,
          error:
            (result as any).error?.message ||
            'Failed to send prize notification',
        };
      }
    } catch (error) {
      this.logger.error('Error sending prize notification:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send custom text message
   */
  async sendTextMessage(
    phoneNumber: string,
    message: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const textMessage: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textMessage),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Text message sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send text message:', result);
        return {
          success: false,
          error: (result as any).error?.message || 'Failed to send message',
        };
      }
    } catch (error) {
      this.logger.error('Error sending text message:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Send document with WhatsApp (useful for invoices, receipts, etc.)
   */
  async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    try {
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      // Add cache busting to document URL
      const cacheBustedUrl = CacheBustingUtil.generateCacheBustedUrl(
        documentUrl,
        filename,
      );

      const documentMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'document',
        document: {
          link: cacheBustedUrl,
          filename: filename,
          ...(caption && { caption }),
        },
      };

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentMessage),
        },
      );

      const result: WhatsAppResponse = await response.json();

      if (response.ok && result.messages && result.messages.length > 0) {
        this.logger.log(
          `Document sent to ${formattedPhoneNumber}. Message ID: ${result.messages[0].id}`,
        );
        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        this.logger.error('Failed to send document:', result);
        return {
          success: false,
          error: (result as any).error?.message || 'Failed to send document',
        };
      }
    } catch (error) {
      this.logger.error('Error sending document:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }
}
