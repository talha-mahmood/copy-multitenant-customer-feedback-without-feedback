import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogLevel, SystemLogCategory } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

interface FestivalCampaign {
  name: string;
  date: Date;
  message: string;
}

@Injectable()
export class FestivalCampaignService {
  private readonly logger = new Logger(FestivalCampaignService.name);

  // Define festival dates (can be moved to database or config)
  private readonly festivals: FestivalCampaign[] = [
    {
      name: 'New Year',
      date: new Date(new Date().getFullYear(), 0, 1), // January 1
      message: 'Happy New Year! Celebrate with us with a special offer!',
    },
    {
      name: 'Valentine\'s Day',
      date: new Date(new Date().getFullYear(), 1, 14), // February 14
      message: 'Happy Valentine\'s Day! Show your love with our special offers!',
    },
    {
      name: 'Chinese New Year',
      date: new Date(new Date().getFullYear(), 1, 10), // Approximate, varies by lunar calendar
      message: 'Gong Xi Fa Cai! Celebrate Chinese New Year with special deals!',
    },
    {
      name: 'Christmas',
      date: new Date(new Date().getFullYear(), 11, 25), // December 25
      message: 'Merry Christmas! Enjoy our festive specials!',
    },
  ];

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
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_8AM) // Run daily at 8 AM
  @Cron(CronExpression.EVERY_MINUTE) // Run every minute for testing
  async sendFestivalCampaigns() {
    this.logger.log('Starting festival campaign cron job...');

    try {
      const today = new Date();
      const currentFestival = this.getTodaysFestival(today);

      if (!currentFestival) {
        this.logger.log('No festival today');
        return;
      }

      this.logger.log(`Today is ${currentFestival.name}!`);

      // Get all merchants with festival campaigns enabled
      const merchantSettings = await this.merchantSettingRepository
        .createQueryBuilder('settings')
        .where('settings.festival_campaign_enabled = :enabled', { enabled: true })
        .andWhere('settings.festival_coupon_batch_id IS NOT NULL')
        .getMany();

      if (merchantSettings.length === 0) {
        this.logger.log('No merchants with festival campaigns enabled');
        return;
      }

      for (const settings of merchantSettings) {
        await this.processMerchantFestivalCampaign(settings, currentFestival);
      }

      this.logger.log('Festival campaign cron job completed');
    } catch (error) {
      this.logger.error('Error in festival campaign cron job', error);
    }
  }

  private getTodaysFestival(date: Date): FestivalCampaign | null {
    const month = date.getMonth();
    const day = date.getDate();

    return this.festivals.find(festival => {
      return festival.date.getMonth() === month && festival.date.getDate() === day;
    }) || null;
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

      // Get coupon batch
      const batch = await this.couponBatchRepository.findOne({
        where: {
          id: settings.festival_coupon_batch_id,
          merchant_id: merchant.id,
          is_active: true,
        },
      });

      if (!batch) {
        this.logger.warn(`Festival coupon batch ${settings.festival_coupon_batch_id} not found`);
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
      const message = `${festival.message}\n\nHi ${customer.name}, celebrate ${festival.name} with ${merchant.business_name}! Here's a special festival offer: Coupon Code: ${coupon.coupon_code} Valid until: ${expiryDate}. Visit us at ${merchant.address || 'our location'} to redeem!`;

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
