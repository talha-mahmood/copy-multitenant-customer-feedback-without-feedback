import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { FestivalMessage } from '../festival-messages/entities/festival-message.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogLevel, SystemLogCategory } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

interface FestivalCampaign {
  name: string;
  date: Date;
  message: string;
  merchantId?: number;
  couponBatchId?: number;
}

@Injectable()
export class FestivalCampaignService {
  private readonly logger = new Logger(FestivalCampaignService.name);

  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('FESTIVAL_MESSAGE_REPOSITORY')
    private festivalMessageRepository: Repository<FestivalMessage>,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_8AM) // Run daily at 8 AM
  @Cron(CronExpression.EVERY_10_SECONDS) // Run every 10 seconds for testing
  async sendFestivalCampaigns() {
    this.logger.log('Starting festival campaign cron job...');

    try {
      const today = new Date();
      
      // Get all active festivals for today from database
      const todaysFestivals = await this.getTodaysFestivals(today);

      if (todaysFestivals.length === 0) {
        this.logger.log('No festivals today');
        return;
      }

      this.logger.log(`Found ${todaysFestivals.length} festival(s) today`);

      // Get all merchants with festival campaigns enabled
      const merchantSettings = await this.merchantSettingRepository
        .createQueryBuilder('settings')
        .where('settings.festival_campaign_enabled = :enabled', { enabled: true })
        .getMany();

      if (merchantSettings.length === 0) {
        this.logger.log('No merchants with festival campaigns enabled');
        return;
      }

      // Process each merchant with their festival messages
      for (const settings of merchantSettings) {
        // Get merchant-specific festivals or use all festivals (that have coupon batches)
        const merchantFestivals = todaysFestivals.filter(
          f => (f.couponBatchId !== null && f.couponBatchId !== undefined) && (!f.merchantId || f.merchantId === settings.merchant_id)
        );

        for (const festival of merchantFestivals) {
          await this.processMerchantFestivalCampaign(settings, festival);
        }
      }

      this.logger.log('Festival campaign cron job completed');
    } catch (error) {
      this.logger.error('Error in festival campaign cron job', error);
    }
  }

  private async getTodaysFestivals(date: Date): Promise<FestivalCampaign[]> {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Get active festivals from database that match today's date
    const festivals = await this.festivalMessageRepository
      .createQueryBuilder('festival')
      .where('festival.is_active = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM festival.festival_date) = :month', { month })
      .andWhere('EXTRACT(DAY FROM festival.festival_date) = :day', { day })
      .getMany();

    return festivals.map(f => ({
      name: f.festival_name,
      date: f.festival_date,
      message: f.message,
      merchantId: f.merchant_id,
      couponBatchId: f.coupon_batch_id,
    }));
  }

  private async processMerchantFestivalCampaign(
    settings: MerchantSetting,
    festival: FestivalCampaign,
  ) {
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
        this.logger.log(`Merchant ${merchant.id} is not annual type, skipping festival campaign`);
        return;
      }

      // Get all active customers
      const customers = await this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.merchant_id = :merchantId', { merchantId: settings.merchant_id })
        .andWhere('customer.phone IS NOT NULL')
        .andWhere('customer.deleted_at IS NULL')
        .getMany();

      this.logger.log(
        `Found ${customers.length} customers for merchant ${merchant.id} festival campaign`,
      );

      for (const customer of customers) {
        await this.sendFestivalMessageToCustomer(customer, merchant, settings, festival);
      }
    } catch (error) {
      this.logger.error(
        `Error processing festival campaign for merchant ${settings.merchant_id}`,
        error,
      );
    }
  }

  private async sendFestivalMessageToCustomer(
    customer: Customer,
    merchant: Merchant,
    settings: MerchantSetting,
    festival: FestivalCampaign,
  ) {
    try {
      // Check if message was already sent today to avoid duplicates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingMessage = await this.whatsappService.findRecentMessage(
        merchant.id,
        customer.id,
        WhatsAppCampaignType.FESTIVAL,
        today,
      );

      if (existingMessage) {
        this.logger.log(
          `Festival message already sent to customer ${customer.id} today`,
        );
        return;
      }

      // Check if merchant has WhatsApp BI credits (festival is BI campaign)
      const creditCheck = await this.walletService.checkMerchantCredits(
        merchant.id,
        'whatsapp_bi',
        1,
      );

      if (!creditCheck.hasCredits) {
        this.logger.warn(
          `Merchant ${merchant.id} has insufficient WhatsApp BI credits for festival campaign`,
        );
        return;
      }

      // Get coupon batch from festival message
      const batch = await this.couponBatchRepository.findOne({
        where: {
          id: festival.couponBatchId,
          merchant_id: merchant.id,
          is_active: true,
        },
      });

      if (!batch) {
        this.logger.warn(`Festival coupon batch ${festival.couponBatchId} not found for festival ${festival.name}`);
        return;
      }

      // Check if batch has expired
      if (new Date(batch.end_date) < new Date()) {
        this.logger.warn(`Festival coupon batch ${batch.id} has expired`);
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
        this.logger.warn(`No available coupons in batch ${batch.id} for festival campaign`);
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

      // Send WhatsApp festival message as BI campaign (automated)
      const message = `${festival.message}Hi ${customer.name}, celebrate ${festival.name} with ${merchant.business_name}! Here's a special festival offer: Coupon Code: ${coupon.coupon_code} Valid until: ${expiryDate}. Visit us at ${merchant.address || 'our location'} to redeem!`;

      try {
        const whatsappMessage = await this.whatsappService.sendWhatsAppMessageWithCredits(
          merchant.id,
          customer.phone,
          message,
          WhatsAppMessageType.BUSINESS_INITIATED,
          WhatsAppCampaignType.FESTIVAL,
          coupon.id,
          customer.id,
        );

        coupon.whatsapp_sent = true;
        await this.couponRepository.save(coupon);

        this.logger.log(
          `Festival campaign message sent to customer ${customer.id} (${customer.name})`,
        );

        // Log successful festival campaign
        await this.systemLogService.log({
          category: SystemLogCategory.CAMPAIGN,
          action: SystemLogAction.BI_FESTIVAL_SENT,
          level: SystemLogLevel.INFO,
          message: `Festival campaign (${festival.name}) message sent to ${customer.name}`,
          userId: merchant.id,
          userType: 'merchant',
          entityType: 'whatsapp_message',
          entityId: whatsappMessage.id,
          metadata: {
            merchant_id: merchant.id,
            customer_id: customer.id,
            coupon_code: coupon.coupon_code,
            festival_name: festival.name,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send festival message to customer ${customer.id}`,
          error,
        );

        // Log failed festival campaign
        await this.systemLogService.log({
          category: SystemLogCategory.CAMPAIGN,
          action: SystemLogAction.BI_FESTIVAL_FAILED,
          level: SystemLogLevel.ERROR,
          message: `Failed to send festival campaign (${festival.name}) to ${customer.name}`,
          userId: merchant.id,
          userType: 'merchant',
          entityType: 'customer',
          entityId: customer.id,
          metadata: {
            merchant_id: merchant.id,
            customer_id: customer.id,
            error: error.message,
            festival_name: festival.name,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error sending festival message to customer ${customer.id}`,
        error,
      );
    }
  }
}
