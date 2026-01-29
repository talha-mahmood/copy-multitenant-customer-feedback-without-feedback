import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Feedback } from './entities/feedback.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogLevel, SystemLogCategory } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

@Injectable()
export class InactiveCustomerRecallService {
  private readonly logger = new Logger(InactiveCustomerRecallService.name);

  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_10AM) // Run daily at 10 AM
  @Cron(CronExpression.EVERY_30_SECONDS) // Run every 30 seconds for testing
  async sendInactiveRecallMessages() {
    this.logger.log('Starting inactive customer recall cron job...');

    try {
      // Get all merchants with inactive recall enabled
      const merchantSettings = await this.merchantSettingRepository
        .createQueryBuilder('settings')
        .where('settings.inactive_recall_enabled = :enabled', { enabled: true })
        .andWhere('settings.inactive_recall_coupon_batch_id IS NOT NULL')
        .andWhere('settings.inactive_recall_days > 0')
        .getMany();

      if (merchantSettings.length === 0) {
        this.logger.log('No merchants with inactive recall enabled');
        return;
      }

      for (const settings of merchantSettings) {
        await this.processMerchantInactiveCustomers(settings);
      }

      this.logger.log('Inactive customer recall cron job completed');
    } catch (error) {
      this.logger.error('Error in inactive customer recall cron job', error);
    }
  }

  private async processMerchantInactiveCustomers(settings: MerchantSetting) {
    try {
      const merchant = await this.merchantRepository.findOne({
        where: { id: settings.merchant_id },
      });

      if (!merchant) {
        this.logger.warn(`Merchant ${settings.merchant_id} not found`);
        return;
      }

      // Only send to annual merchants (temporary cannot use BI messages)
      if (merchant.merchant_type !== 'annual') {
        this.logger.log(`Merchant ${merchant.id} is not annual type, skipping inactive recall`);
        return;
      }

      // Calculate the cutoff date for inactivity
      const inactiveCutoffDate = new Date();
      inactiveCutoffDate.setDate(inactiveCutoffDate.getDate() - settings.inactive_recall_days);

      // Find customers who haven't had feedback in N days
      const inactiveCustomers = await this.customerRepository
        .createQueryBuilder('customer')
        .leftJoin('feedbacks', 'feedback', 'feedback.customer_id = customer.id')
        .where('customer.merchant_id = :merchantId', { merchantId: settings.merchant_id })
        .andWhere('customer.phone IS NOT NULL')
        .andWhere('customer.deleted_at IS NULL')
        .groupBy('customer.id')
        .having('MAX(feedback.created_at) < :cutoffDate OR MAX(feedback.created_at) IS NULL', {
          cutoffDate: inactiveCutoffDate,
        })
        .getMany();

      this.logger.log(
        `Found ${inactiveCustomers.length} inactive customers for merchant ${merchant.id}`,
      );

      for (const customer of inactiveCustomers) {
        await this.sendRecallMessageToCustomer(customer, merchant, settings);
      }
    } catch (error) {
      this.logger.error(`Error processing inactive customers for merchant ${settings.merchant_id}`, error);
    }
  }

  private async sendRecallMessageToCustomer(
    customer: Customer,
    merchant: Merchant,
    settings: MerchantSetting,
  ) {
    try {
      // Check if message was already sent today to avoid duplicates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingMessage = await this.whatsappService.findRecentMessage(
        merchant.id,
        customer.id,
        WhatsAppCampaignType.INACTIVE_RECALL,
        today,
      );

      if (existingMessage) {
        this.logger.log(
          `Recall message already sent to customer ${customer.id} today`,
        );
        return;
      }

      // Check if merchant has WhatsApp BI credits (recall is BI campaign)
      const creditCheck = await this.walletService.checkMerchantCredits(
        merchant.id,
        'whatsapp_bi',
        1,
      );

      if (!creditCheck.hasCredits) {
        this.logger.warn(
          `Merchant ${merchant.id} has insufficient WhatsApp BI credits for inactive recall`,
        );
        return;
      }

      // Get coupon batch
      const batch = await this.couponBatchRepository.findOne({
        where: {
          id: settings.inactive_recall_coupon_batch_id,
          merchant_id: merchant.id,
          is_active: true,
        },
      });

      if (!batch) {
        this.logger.warn(`Inactive recall coupon batch ${settings.inactive_recall_coupon_batch_id} not found`);
        return;
      }

      // Check if batch has expired
      if (new Date(batch.end_date) < new Date()) {
        this.logger.warn(`Inactive recall coupon batch ${batch.id} has expired`);
        return;
      }

      // Find an available coupon
      const coupon = await this.couponRepository.findOne({
        where: {
          batch_id: batch.id,
          status: 'created',
        },
        order: { created_at: 'ASC' },
      });

      if (!coupon) {
        this.logger.warn(`No available coupons in batch ${batch.id} for inactive recall`);
        return;
      }

      // Update coupon: assign to customer and mark as issued
      coupon.customer_id = customer.id;
      coupon.status = 'issued';
      coupon.issued_at = new Date();
      await this.couponRepository.save(coupon);

      // Increment batch issued_quantity
      batch.issued_quantity += 1;
      await this.couponBatchRepository.save(batch);

      const expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send WhatsApp recall message as BI campaign (automated)
      const message = `Hi ${customer.name}, we miss you at ${merchant.business_name}! It's been a while since your last visit. We have a special welcome back offer for you: Coupon Code: ${coupon.coupon_code} Valid until: ${expiryDate}. Visit us at ${merchant.address || 'our location'} to redeem!`;

      try {
        const whatsappMessage = await this.whatsappService.sendWhatsAppMessageWithCredits(
          merchant.id,
          customer.phone,
          message,
          WhatsAppMessageType.BUSINESS_INITIATED,
          WhatsAppCampaignType.INACTIVE_RECALL,
          coupon.id,
          customer.id,
        );

        coupon.whatsapp_sent = true;
        await this.couponRepository.save(coupon);

        this.logger.log(
          `Inactive recall message sent to customer ${customer.id} (${customer.name})`,
        );

        // Log successful recall campaign
        await this.systemLogService.log({
          category: SystemLogCategory.CAMPAIGN,
          action: SystemLogAction.BI_INACTIVE_RECALL_SENT,
          level: SystemLogLevel.INFO,
          message: `Inactive customer recall message sent to ${customer.name}`,
          userId: merchant.id,
          userType: 'merchant',
          entityType: 'whatsapp_message',
          entityId: whatsappMessage.id,
          metadata: {
            merchant_id: merchant.id,
            customer_id: customer.id,
            coupon_code: coupon.coupon_code,
            inactive_days: settings.inactive_recall_days,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send inactive recall message to customer ${customer.id}`,
          error,
        );

        // Log failed recall campaign
        await this.systemLogService.log({
          category: SystemLogCategory.CAMPAIGN,
          action: SystemLogAction.BI_INACTIVE_RECALL_FAILED,
          level: SystemLogLevel.ERROR,
          message: `Failed to send inactive recall message to ${customer.name}`,
          userId: merchant.id,
          userType: 'merchant',
          entityType: 'customer',
          entityId: customer.id,
          metadata: {
            merchant_id: merchant.id,
            customer_id: customer.id,
            error: error.message,
            inactive_days: settings.inactive_recall_days,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error sending recall message to customer ${customer.id}`,
        error,
      );
    }
  }
}
