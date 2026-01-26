import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import { WhatsAppMessageType, WhatsAppMessageStatus, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';
import { MerchantWallet } from '../wallets/entities/merchant-wallet.entity';
import { CreditsLedger } from '../wallets/entities/credits-ledger.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { WHATSAPP_MESSAGE_REPOSITORY } from './whatsapp.provider';
import { MERCHANT_WALLET_REPOSITORY, CREDITS_LEDGER_REPOSITORY } from '../wallets/wallet.provider';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';



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

  constructor(
    private configService: ConfigService,
    @Inject(WHATSAPP_MESSAGE_REPOSITORY)
    private readonly whatsAppMessageRepository: Repository<WhatsAppMessage>,
    @Inject(MERCHANT_WALLET_REPOSITORY)
    private readonly merchantWalletRepository: Repository<MerchantWallet>,
    @Inject(CREDITS_LEDGER_REPOSITORY)
    private readonly creditsLedgerRepository: Repository<CreditsLedger>,
    @Inject('MERCHANT_REPOSITORY')
    private readonly merchantRepository: Repository<Merchant>,
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
    private readonly systemLogService: SystemLogService,
  ) {
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

  /**
   * Validate merchant can send specific message type
   * Temporary merchants: ONLY User-Initiated (UI)
   * Annual merchants: BOTH User-Initiated (UI) and Business-Initiated (BI)
   */
  async validateMerchantMessageType(
    merchantId: number,
    messageType: WhatsAppMessageType,
  ): Promise<void> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Temporary merchants can ONLY send UI messages
    if (merchant.merchant_type === 'temporary' && messageType === WhatsAppMessageType.BUSINESS_INITIATED) {
      throw new BadRequestException(
        'Temporary merchants can only send User-Initiated (UI) messages. Upgrade to Annual subscription to send Business-Initiated (BI) messages.',
      );
    }
  }

  /**
   * Check if merchant has sufficient WhatsApp credits
   */
  async checkWhatsAppCredits(
    merchantId: number,
    messageType: WhatsAppMessageType,
    requiredCredits: number = 1,
  ): Promise<{ hasCredits: boolean; availableCredits: number }> {
    const wallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!wallet) {
      return { hasCredits: false, availableCredits: 0 };
    }

    let availableCredits = 0;
    let hasCredits = false;

    if (messageType === WhatsAppMessageType.USER_INITIATED) {
      availableCredits = wallet.whatsapp_ui_credits;
      hasCredits = wallet.whatsapp_ui_credits >= requiredCredits;
    } else {
      availableCredits = wallet.whatsapp_bi_credits;
      hasCredits = wallet.whatsapp_bi_credits >= requiredCredits;
    }

    return { hasCredits, availableCredits };
  }

  /**
   * Deduct WhatsApp credits (called ONLY after successful delivery)
   * Credits are deducted per message type (UI or BI)
   */
  async deductWhatsAppCredits(
    merchantId: number,
    messageType: WhatsAppMessageType,
    messageId: number,
    creditsToDeduct: number = 1,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      let creditType: string;
      let balanceBefore: number;
      let balanceAfter: number;

      if (messageType === WhatsAppMessageType.USER_INITIATED) {
        if (wallet.whatsapp_ui_credits < creditsToDeduct) {
          throw new BadRequestException('Insufficient WhatsApp UI credits');
        }
        creditType = 'whatsapp_ui';
        balanceBefore = wallet.whatsapp_ui_credits;
        balanceAfter = wallet.whatsapp_ui_credits - creditsToDeduct;

        await queryRunner.manager.update(MerchantWallet, wallet.id, {
          whatsapp_ui_credits: balanceAfter,
          total_credits_used: wallet.total_credits_used + creditsToDeduct,
        });
      } else {
        if (wallet.whatsapp_bi_credits < creditsToDeduct) {
          throw new BadRequestException('Insufficient WhatsApp BI credits');
        }
        creditType = 'whatsapp_bi';
        balanceBefore = wallet.whatsapp_bi_credits;
        balanceAfter = wallet.whatsapp_bi_credits - creditsToDeduct;

        await queryRunner.manager.update(MerchantWallet, wallet.id, {
          whatsapp_bi_credits: balanceAfter,
          total_credits_used: wallet.total_credits_used + creditsToDeduct,
        });
      }

      // Record in credits ledger (bank-style)
      await queryRunner.manager.save(CreditsLedger, {
        owner_type: 'merchant',
        owner_id: merchantId,
        credit_type: creditType,
        action: 'deduct',
        amount: -creditsToDeduct,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        related_object_type: 'whatsapp_message',
        related_object_id: messageId,
        description: `WhatsApp ${messageType} message sent`,
        metadata: JSON.stringify({
          message_type: messageType,
          credits_deducted: creditsToDeduct,
        }),
      });

      // Update message record
      await queryRunner.manager.update(WhatsAppMessage, messageId, {
        credits_deducted: creditsToDeduct,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Send WhatsApp message with UI/BI classification
   * Deduction happens ONLY after successful delivery
   */
  async sendWhatsAppMessageWithCredits(
    merchantId: number,
    phoneNumber: string,
    messageContent: string,
    messageType: WhatsAppMessageType,
    campaignType?: WhatsAppCampaignType,
    couponId?: number,
    customerId?: number,
  ): Promise<WhatsAppMessage> {
    // Step 1: Validate merchant can send this type of message
    await this.validateMerchantMessageType(merchantId, messageType);

    // Step 2: Check sufficient credits
    const { hasCredits, availableCredits } = await this.checkWhatsAppCredits(merchantId, messageType, 1);
    if (!hasCredits) {
      throw new BadRequestException(
        `Insufficient ${messageType} credits. Available: ${availableCredits}, Required: 1`,
      );
    }

    // Step 3: Create message record
    const message = this.whatsAppMessageRepository.create({
      merchant_id: merchantId,
      customer_id: customerId,
      coupon_id: couponId,
      message_type: messageType,
      campaign_type: campaignType,
      phone_number: phoneNumber,
      message_content: messageContent,
      status: WhatsAppMessageStatus.PENDING,
      metadata: JSON.stringify({
        created_source: campaignType || 'manual',
        message_type_classification: messageType,
      }),
    });

    const savedMessage = await this.whatsAppMessageRepository.save(message);

    // Step 4: Send via WhatsApp API
    try {
      const sendResult = await this.sendGeneralMessage(phoneNumber, messageContent);

      if (sendResult.success) {
        // Update message as sent
        await this.whatsAppMessageRepository.update(savedMessage.id, {
          message_id: sendResult.messageId,
          status: WhatsAppMessageStatus.SENT,
          sent_at: new Date(),
        });

        // Step 5: Deduct credits ONLY after successful send
        await this.deductWhatsAppCredits(merchantId, messageType, savedMessage.id, 1);

        // Log successful message send with source-specific action
        await this.logMessageSuccess(merchantId, customerId, messageType, campaignType, savedMessage.id, phoneNumber, sendResult.messageId || 'unknown');

        const updatedMessage = await this.whatsAppMessageRepository.findOne({ where: { id: savedMessage.id } });
        if (!updatedMessage) {
          throw new NotFoundException('Message not found after update');
        }
        return updatedMessage;
      } else {
        // Mark message as failed
        await this.whatsAppMessageRepository.update(savedMessage.id, {
          status: WhatsAppMessageStatus.FAILED,
          failed_at: new Date(),
          failure_reason: sendResult.error,
        });

        // Log failed message with source-specific action
        await this.logMessageFailure(merchantId, customerId, messageType, campaignType, savedMessage.id, phoneNumber, sendResult.error || 'Unknown error');

        throw new BadRequestException(`Failed to send WhatsApp message: ${sendResult.error}`);
      }
    } catch (error) {
      // Mark message as failed
      await this.whatsAppMessageRepository.update(savedMessage.id, {
        status: WhatsAppMessageStatus.FAILED,
        failed_at: new Date(),
        failure_reason: error.message,
      });

      // Log exception failure with source-specific action
      await this.logMessageFailure(merchantId, customerId, messageType, campaignType, savedMessage.id, phoneNumber, error.message, error.stack);

      throw new BadRequestException(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Get merchant WhatsApp message statistics
   */
  async getMerchantWhatsAppStats(merchantId: number, startDate?: Date, endDate?: Date) {
    const query = this.whatsAppMessageRepository
      .createQueryBuilder('msg')
      .where('msg.merchant_id = :merchantId', { merchantId });

    if (startDate) {
      query.andWhere('msg.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('msg.created_at <= :endDate', { endDate });
    }

    const [messages, total] = await query.getManyAndCount();

    const uiMessages = messages.filter((m) => m.message_type === WhatsAppMessageType.USER_INITIATED);
    const biMessages = messages.filter((m) => m.message_type === WhatsAppMessageType.BUSINESS_INITIATED);

    const uiSuccess = uiMessages.filter((m) => m.status === WhatsAppMessageStatus.DELIVERED || m.status === WhatsAppMessageStatus.SENT).length;
    const uiFailed = uiMessages.filter((m) => m.status === WhatsAppMessageStatus.FAILED).length;

    const biSuccess = biMessages.filter((m) => m.status === WhatsAppMessageStatus.DELIVERED || m.status === WhatsAppMessageStatus.SENT).length;
    const biFailed = biMessages.filter((m) => m.status === WhatsAppMessageStatus.FAILED).length;

    const uiCreditsUsed = uiMessages.reduce((sum, m) => sum + m.credits_deducted, 0);
    const biCreditsUsed = biMessages.reduce((sum, m) => sum + m.credits_deducted, 0);

    return {
      total,
      user_initiated: {
        total: uiMessages.length,
        success: uiSuccess,
        failed: uiFailed,
        credits_used: uiCreditsUsed,
      },
      business_initiated: {
        total: biMessages.length,
        success: biSuccess,
        failed: biFailed,
        credits_used: biCreditsUsed,
      },
    };
  }

  /**
   * Helper method to log successful WhatsApp message with source-specific action
   */
  private async logMessageSuccess(
    merchantId: number,
    customerId: number | undefined,
    messageType: WhatsAppMessageType,
    campaignType: WhatsAppCampaignType | undefined,
    messageId: number,
    phoneNumber: string,
    whatsappMessageId: string,
  ) {
    const metadata = {
      message_id: messageId,
      merchant_id: merchantId,
      message_type: messageType,
      campaign_type: campaignType,
      phone_number: phoneNumber,
      whatsapp_message_id: whatsappMessageId,
    };

    if (messageType === WhatsAppMessageType.USER_INITIATED) {
      // Determine source for UI messages
      let action: SystemLogAction;
      let source: string;

      switch (campaignType) {
        case WhatsAppCampaignType.FEEDBACK:
          action = SystemLogAction.UI_FEEDBACK_SENT;
          source = 'feedback form';
          break;
        case WhatsAppCampaignType.LUCKYDRAW:
          action = SystemLogAction.UI_LUCKYDRAW_SENT;
          source = 'lucky draw spin';
          break;
        case WhatsAppCampaignType.CUSTOM:
          action = SystemLogAction.UI_HOMEPAGE_SENT;
          source = 'homepage';
          break;
        default:
          action = SystemLogAction.UI_FEEDBACK_SENT;
          source = 'feedback/luckydraw';
      }

      await this.systemLogService.logWhatsAppUI(
        action,
        `WhatsApp UI message sent successfully from ${source}`,
        merchantId,
        customerId,
        metadata,
      );
    } else {
      // Business-Initiated messages
      let action: SystemLogAction;
      let source: string;

      switch (campaignType) {
        case WhatsAppCampaignType.BIRTHDAY:
          action = SystemLogAction.BI_BIRTHDAY_SENT;
          source = 'birthday campaign';
          break;
        case WhatsAppCampaignType.INACTIVE_RECALL:
          action = SystemLogAction.BI_INACTIVE_RECALL_SENT;
          source = 'inactive customer recall';
          break;
        case WhatsAppCampaignType.FESTIVAL:
          action = SystemLogAction.BI_FESTIVAL_SENT;
          source = 'festival broadcast';
          break;
        default:
          action = SystemLogAction.BI_CUSTOM_CAMPAIGN_SENT;
          source = 'custom campaign';
      }

      await this.systemLogService.logWhatsAppBI(
        action,
        `WhatsApp BI message sent successfully from ${source}`,
        merchantId,
        customerId,
        metadata,
      );
    }
  }

  /**
   * Helper method to log failed WhatsApp message with source-specific action
   */
  private async logMessageFailure(
    merchantId: number,
    customerId: number | undefined,
    messageType: WhatsAppMessageType,
    campaignType: WhatsAppCampaignType | undefined,
    messageId: number,
    phoneNumber: string,
    error: string,
    stack?: string,
  ) {
    const metadata: any = {
      message_id: messageId,
      merchant_id: merchantId,
      message_type: messageType,
      campaign_type: campaignType,
      phone_number: phoneNumber,
      error,
    };

    if (stack) {
      metadata.stack = stack;
    }

    if (messageType === WhatsAppMessageType.USER_INITIATED) {
      // Determine source for UI messages
      let action: SystemLogAction;
      let source: string;

      switch (campaignType) {
        case WhatsAppCampaignType.FEEDBACK:
          action = SystemLogAction.UI_FEEDBACK_FAILED;
          source = 'feedback form';
          break;
        case WhatsAppCampaignType.LUCKYDRAW:
          action = SystemLogAction.UI_LUCKYDRAW_FAILED;
          source = 'lucky draw spin';
          break;
        case WhatsAppCampaignType.CUSTOM:
          action = SystemLogAction.UI_HOMEPAGE_FAILED;
          source = 'homepage';
          break;
        default:
          action = SystemLogAction.UI_FEEDBACK_FAILED;
          source = 'feedback/luckydraw';
      }

      await this.systemLogService.logWhatsAppUI(
        action,
        `WhatsApp UI message failed from ${source}: ${error}`,
        merchantId,
        customerId,
        metadata,
      );
    } else {
      // Business-Initiated messages
      let action: SystemLogAction;
      let source: string;

      switch (campaignType) {
        case WhatsAppCampaignType.BIRTHDAY:
          action = SystemLogAction.BI_BIRTHDAY_FAILED;
          source = 'birthday campaign';
          break;
        case WhatsAppCampaignType.INACTIVE_RECALL:
          action = SystemLogAction.BI_INACTIVE_RECALL_FAILED;
          source = 'inactive customer recall';
          break;
        case WhatsAppCampaignType.FESTIVAL:
          action = SystemLogAction.BI_FESTIVAL_FAILED;
          source = 'festival broadcast';
          break;
        default:
          action = SystemLogAction.BI_CUSTOM_CAMPAIGN_FAILED;
          source = 'custom campaign';
      }

      await this.systemLogService.logWhatsAppBI(
        action,
        `WhatsApp BI message failed from ${source}: ${error}`,
        merchantId,
        customerId,
        metadata,
      );
    }
  }
}
