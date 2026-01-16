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
import { SystemLogAction, SystemLogLevel } from 'src/common/enums/system-log.enum';

@Injectable()
export class BirthdayMessageService {
  private readonly logger = new Logger(BirthdayMessageService.name);

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

  // @Cron(CronExpression.EVERY_DAY_AT_9AM) // Run daily at 9 AM
    @Cron(CronExpression.EVERY_10_SECONDS) // Run every 10 seconds
  async sendBirthdayMessages() {
    this.logger.log('Starting birthday message cron job...');

    try {
      // Get all merchants with birthday message enabled
      const merchantSettings = await this.merchantSettingRepository
        .createQueryBuilder('settings')
        .where('settings.birthday_message_enabled = :enabled', { enabled: true })
        .andWhere('settings.birthday_coupon_batch_id IS NOT NULL')
        .getMany();

      if (merchantSettings.length === 0) {
        this.logger.log('No merchants with birthday messages enabled');
        return;
      }

      for (const settings of merchantSettings) {
        await this.processMerchantBirthdays(settings);
      }

      this.logger.log('Birthday message cron job completed');
    } catch (error) {
      this.logger.error('Error in birthday message cron job', error);
    }
  }

  private async processMerchantBirthdays(settings: MerchantSetting) {
    try {
      const merchant = await this.merchantRepository.findOne({
        where: { id: settings.merchant_id },
      });

      if (!merchant) {
        this.logger.warn(`Merchant ${settings.merchant_id} not found`);
        return;
      }

      // Get today's date
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
      const currentDay = today.getDate();

      // Calculate the date range for birthdays
      const daysBeforeDate = new Date(today);
      daysBeforeDate.setDate(daysBeforeDate.getDate() + settings.days_before_birthday);

      const daysAfterDate = new Date(today);
      daysAfterDate.setDate(daysAfterDate.getDate() - settings.days_after_birthday);

      // Find customers with birthdays in the range
      const customers = await this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.merchant_id = :merchantId', { merchantId: settings.merchant_id })
        .andWhere('customer.date_of_birth IS NOT NULL')
        .andWhere('customer.phone IS NOT NULL')
        .andWhere('customer.deleted_at IS NULL')
        .getMany();

      for (const customer of customers) {
        if (this.shouldSendBirthdayMessage(customer.date_of_birth, settings, today)) {
          await this.sendBirthdayMessageToCustomer(customer, merchant, settings);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing birthdays for merchant ${settings.merchant_id}`, error);
    }
  }

  private shouldSendBirthdayMessage(
    dateOfBirth: Date,
    settings: MerchantSetting,
    today: Date,
  ): boolean {
    const birthDate = new Date(dateOfBirth);
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();

    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Calculate days until birthday (ignoring year)
    const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if birthday is within the configured range
    // Negative diffDays means birthday has passed
    if (diffDays >= -settings.days_after_birthday && diffDays <= settings.days_before_birthday) {
      return true;
    }

    return false;
  }

  private async sendBirthdayMessageToCustomer(
    customer: Customer,
    merchant: Merchant,
    settings: MerchantSetting,
  ) {
    try {
      // Check if birthday message was already sent this year
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st of current year

      const existingBirthdayCoupon = await this.couponRepository.findOne({
        where: {
          customer_id: customer.id,
          batch_id: settings.birthday_coupon_batch_id,
        },
      });

      if (existingBirthdayCoupon && existingBirthdayCoupon.issued_at) {
        const issuedYear = new Date(existingBirthdayCoupon.issued_at).getFullYear();
        if (issuedYear === currentYear) {
          this.logger.log(
            `Birthday message already sent to customer ${customer.id} this year (${currentYear})`,
          );
          return;
        }
      }

      // Check if merchant has WhatsApp credits
      const creditCheck = await this.walletService.checkMerchantCredits(
        merchant.id,
        'whatsapp message',
        1,
      );

      if (!creditCheck.hasCredits) {
        this.logger.warn(
          `Merchant ${merchant.id} has insufficient WhatsApp credits for birthday message`,
        );
        return;
      }

      // Get coupon batch
      const batch = await this.couponBatchRepository.findOne({
        where: {
          id: settings.birthday_coupon_batch_id,
          merchant_id: merchant.id,
          is_active: true,
        },
      });

      if (!batch) {
        this.logger.warn(`Birthday coupon batch ${settings.birthday_coupon_batch_id} not found`);
        return;
      }

      // Check if batch is still valid
      if (batch.end_date < new Date()) {
        this.logger.warn(`Birthday coupon batch ${batch.id} has expired`);
        return;
      }

      // Find available coupon
      const coupon = await this.couponRepository.findOne({
        where: {
          batch_id: batch.id,
          status: 'created',
        },
        order: { created_at: 'ASC' },
      });

      if (!coupon) {
        this.logger.warn(`No available coupons in batch ${batch.id} for birthday message`);
        return;
      }

      // Assign coupon to customer
      coupon.customer_id = customer.id;
      coupon.status = 'issued';
      coupon.issued_at = new Date();

      const expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send WhatsApp birthday message (no newlines allowed in WhatsApp template parameters)
      const message = `Happy Birthday ${customer.name}! From all of us at ${merchant.business_name}, we wish you a wonderful day! Here's a special birthday gift for you: Coupon Code: ${coupon.coupon_code} Valid until: ${expiryDate}. Visit us at ${merchant.address || 'our location'} to redeem your gift!`;

      const whatsappResult = await this.whatsappService.sendGeneralMessage(
        customer.phone,
        message,
      );

      if (whatsappResult.success) {
        coupon.whatsapp_sent = true;
        await this.couponRepository.save(coupon);

        // Increment batch issued_quantity
        batch.issued_quantity += 1;
        await this.couponBatchRepository.save(batch);

        // Deduct WhatsApp credit
        await this.walletService.deductWhatsAppCredit(merchant.id, 1);

        // Log birthday campaign trigger
        await this.systemLogService.logCampaign(
          SystemLogAction.CAMPAIGN_TRIGGERED,
          `Birthday campaign sent to ${customer.name}`,
          {
            campaign_type: 'birthday',
            customer_id: customer.id,
            customer_name: customer.name,
            merchant_id: merchant.id,
            merchant_name: merchant.business_name,
            coupon_code: coupon.coupon_code,
            phone: customer.phone,
          },
        );

        this.logger.log(
          `Birthday message sent to customer ${customer.id} for merchant ${merchant.id}`,
        );
      } else {
        // Log failed WhatsApp message
        await this.systemLogService.logWhatsApp(
          SystemLogAction.MESSAGE_FAILED,
          `Failed to send birthday message to ${customer.name}`,
          customer.id,
          {
            campaign_type: 'birthday',
            customer_id: customer.id,
            merchant_id: merchant.id,
            error: whatsappResult.error,
            phone: customer.phone,
          },
        );

        this.logger.error(
          `Failed to send birthday message to customer ${customer.id}: ${whatsappResult.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending birthday message to customer ${customer.id}`, error);
    }
  }
}
