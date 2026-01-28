import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduledCampaign, TargetAudience, CampaignStatus } from './entities/scheduled-campaign.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { Feedback } from '../feedbacks/entities/feedback.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogLevel, SystemLogCategory } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

@Injectable()
export class ScheduledCampaignService {
  private readonly logger = new Logger(ScheduledCampaignService.name);

  constructor(
    @Inject('SCHEDULED_CAMPAIGN_REPOSITORY')
    private scheduledCampaignRepository: Repository<ScheduledCampaign>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  // @Cron(CronExpression.EVERY_5_MINUTES) // Run every 5 minutes
  @Cron(CronExpression.EVERY_MINUTE) // Run every minute for testing
  async processScheduledCampaigns() {
    this.logger.log('Starting scheduled campaigns cron job...');

    try {
      const now = new Date();

      // Find campaigns that are scheduled and due to be sent
      const dueCampaigns = await this.scheduledCampaignRepository.find({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduled_date: LessThanOrEqual(now),
        },
        order: { scheduled_date: 'ASC' },
      });

      if (dueCampaigns.length === 0) {
        this.logger.log('No scheduled campaigns due');
        return;
      }

      this.logger.log(`Found ${dueCampaigns.length} campaigns to process`);

      for (const campaign of dueCampaigns) {
        await this.processCampaign(campaign);
      }

      this.logger.log('Scheduled campaigns cron job completed');
    } catch (error) {
      this.logger.error('Error in scheduled campaigns cron job', error);
    }
  }

  private async processCampaign(campaign: ScheduledCampaign) {
    try {
      this.logger.log(`Processing campaign ${campaign.id}: ${campaign.campaign_name}`);

      // Update status to processing
      campaign.status = CampaignStatus.PROCESSING;
      campaign.started_at = new Date();
      await this.scheduledCampaignRepository.save(campaign);

      const merchant = await this.merchantRepository.findOne({
        where: { id: campaign.merchant_id },
      });

      if (!merchant) {
        this.logger.warn(`Merchant ${campaign.merchant_id} not found`);
        campaign.status = CampaignStatus.FAILED;
        await this.scheduledCampaignRepository.save(campaign);
        return;
      }

      // Only send to annual merchants (temporary cannot use BI messages)
      if (merchant.merchant_type !== 'annual') {
        this.logger.log(`Merchant ${merchant.id} is not annual type, cannot send scheduled campaign`);
        campaign.status = CampaignStatus.FAILED;
        await this.scheduledCampaignRepository.save(campaign);
        return;
      }

      // Get targeted customers based on audience
      const customers = await this.getTargetedCustomers(campaign, merchant.id);

      campaign.total_customers = customers.length;
      await this.scheduledCampaignRepository.save(campaign);

      this.logger.log(`Found ${customers.length} customers for campaign ${campaign.id}`);

      if (customers.length === 0) {
        campaign.status = CampaignStatus.COMPLETED;
        campaign.completed_at = new Date();
        await this.scheduledCampaignRepository.save(campaign);
        return;
      }

      // Send messages to all targeted customers
      for (const customer of customers) {
        const success = await this.sendCampaignMessageToCustomer(customer, merchant, campaign);
        
        if (success) {
          campaign.messages_sent += 1;
        } else {
          campaign.messages_failed += 1;
        }

        await this.scheduledCampaignRepository.save(campaign);
      }

      // Mark campaign as completed
      campaign.status = CampaignStatus.COMPLETED;
      campaign.completed_at = new Date();
      await this.scheduledCampaignRepository.save(campaign);

      this.logger.log(
        `Campaign ${campaign.id} completed: ${campaign.messages_sent} sent, ${campaign.messages_failed} failed`,
      );

      // Log campaign completion
      await this.systemLogService.log({
        category: SystemLogCategory.CAMPAIGN,
        action: SystemLogAction.BI_CUSTOM_CAMPAIGN_SENT,
        level: SystemLogLevel.INFO,
        message: `Scheduled campaign "${campaign.campaign_name}" completed`,
        userId: merchant.id,
        userType: 'merchant',
        entityType: 'scheduled_campaign',
        entityId: campaign.id,
        metadata: {
          merchant_id: merchant.id,
          campaign_id: campaign.id,
          total_customers: campaign.total_customers,
          messages_sent: campaign.messages_sent,
          messages_failed: campaign.messages_failed,
        },
      });
    } catch (error) {
      this.logger.error(`Error processing campaign ${campaign.id}`, error);
      campaign.status = CampaignStatus.FAILED;
      campaign.completed_at = new Date();
      await this.scheduledCampaignRepository.save(campaign);
    }
  }

  private async getTargetedCustomers(
    campaign: ScheduledCampaign,
    merchantId: number,
  ): Promise<Customer[]> {
    const baseQuery = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.merchant_id = :merchantId', { merchantId })
      .andWhere('customer.phone IS NOT NULL')
      .andWhere('customer.deleted_at IS NULL');

    switch (campaign.target_audience) {
      case TargetAudience.ALL:
        return baseQuery.getMany();

      case TargetAudience.ACTIVE:
        // Customers who have submitted feedback in last 30 days
        return baseQuery
          .innerJoin('feedbacks', 'feedback', 'feedback.customer_id = customer.id')
          .andWhere('feedback.created_at >= NOW() - INTERVAL \'30 days\'')
          .groupBy('customer.id')
          .getMany();

      case TargetAudience.INACTIVE:
        // Customers who haven't submitted feedback in last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        return baseQuery
          .leftJoin('feedbacks', 'feedback', 'feedback.customer_id = customer.id')
          .andWhere(
            '(feedback.id IS NULL OR feedback.created_at < :ninetyDaysAgo)',
            { ninetyDaysAgo },
          )
          .groupBy('customer.id')
          .getMany();

      case TargetAudience.FIRST_TIME:
        // Customers with only 1 feedback
        return baseQuery
          .innerJoin('feedbacks', 'feedback', 'feedback.customer_id = customer.id')
          .groupBy('customer.id')
          .having('COUNT(feedback.id) = 1')
          .getMany();

      case TargetAudience.RETURNING:
        // Customers with more than 1 feedback
        return baseQuery
          .innerJoin('feedbacks', 'feedback', 'feedback.customer_id = customer.id')
          .groupBy('customer.id')
          .having('COUNT(feedback.id) > 1')
          .getMany();

      default:
        return baseQuery.getMany();
    }
  }

  private async sendCampaignMessageToCustomer(
    customer: Customer,
    merchant: Merchant,
    campaign: ScheduledCampaign,
  ): Promise<boolean> {
    try {
      // Check if message was already sent today to avoid duplicates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingMessage = await this.whatsappService.findRecentMessage(
        merchant.id,
        customer.id,
        WhatsAppCampaignType.CUSTOM,
        today,
      );

      if (existingMessage) {
        this.logger.log(
          `Campaign message already sent to customer ${customer.id} today`,
        );
        return false;
      }

      // Check if merchant has WhatsApp BI credits (scheduled campaigns are BI)
      const creditCheck = await this.walletService.checkMerchantCredits(
        merchant.id,
        'whatsapp_bi',
        1,
      );

      if (!creditCheck.hasCredits) {
        this.logger.warn(
          `Merchant ${merchant.id} has insufficient WhatsApp BI credits for scheduled campaign`,
        );
        return false;
      }

      let coupon: Coupon | null = null;
      let couponCode = '';
      let expiryDate = '';

      // If campaign includes coupons, assign one
      if (campaign.send_coupons && campaign.coupon_batch_id) {
        const batch = await this.couponBatchRepository.findOne({
          where: {
            id: campaign.coupon_batch_id,
            merchant_id: merchant.id,
            is_active: true,
          },
        });

        if (batch && new Date(batch.end_date) >= new Date()) {
          coupon = await this.couponRepository.findOne({
            where: {
              batch_id: batch.id,
              status: 'created',
            },
            order: { created_at: 'ASC' },
          });

          if (coupon) {
            // Update coupon: assign to customer and mark as issued
            coupon.customer_id = customer.id;
            coupon.status = 'issued';
            coupon.issued_at = new Date();
            await this.couponRepository.save(coupon);

            // Increment batch issued_quantity
            batch.issued_quantity += 1;
            await this.couponBatchRepository.save(batch);

            couponCode = coupon.coupon_code;
            expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        }
      }

      // Build message with optional coupon
      let message = campaign.campaign_message;
      message = message.replace('{customer_name}', customer.name);
      message = message.replace('{business_name}', merchant.business_name);

      if (couponCode) {
        message += `\n\nCoupon Code: ${couponCode}\nValid until: ${expiryDate}`;
      }

      // Send WhatsApp message as BI campaign (automated)
      const whatsappMessage = await this.whatsappService.sendWhatsAppMessageWithCredits(
        merchant.id,
        customer.phone,
        message,
        WhatsAppMessageType.BUSINESS_INITIATED,
        WhatsAppCampaignType.CUSTOM,
        coupon?.id,
        customer.id,
      );

      if (coupon) {
        coupon.whatsapp_sent = true;
        await this.couponRepository.save(coupon);
      }

      this.logger.log(
        `Scheduled campaign message sent to customer ${customer.id} (${customer.name})`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send scheduled campaign message to customer ${customer.id}`,
        error,
      );

      // Log failed message
      await this.systemLogService.log({
        category: SystemLogCategory.CAMPAIGN,
        action: SystemLogAction.BI_CUSTOM_CAMPAIGN_FAILED,
        level: SystemLogLevel.ERROR,
        message: `Failed to send scheduled campaign to ${customer.name}`,
        userId: merchant.id,
        userType: 'merchant',
        entityType: 'customer',
        entityId: customer.id,
        metadata: {
          merchant_id: merchant.id,
          customer_id: customer.id,
          campaign_id: campaign.id,
          error: error.message,
        },
      });

      return false;
    }
  }
}
