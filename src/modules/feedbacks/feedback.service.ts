import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { PresetReview } from './entities/preset-review.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { randomBytes } from 'crypto';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogLevel, SystemLogCategory } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('PRESET_REVIEW_REPOSITORY')
    private presetReviewRepository: Repository<PresetReview>,
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check if customer already exists
      let savedCustomer = await this.customerRepository.findOne({
        where: { phone: createFeedbackDto.phoneNumber },
      });

      let isNewCustomer = false;

      if (!savedCustomer) {
        isNewCustomer = true;
        // 2. Create Customer if doesn't exist
        const customerData: any = {
          name: createFeedbackDto.name,
          email: createFeedbackDto.email,
          phone: createFeedbackDto.phoneNumber,
          address: createFeedbackDto.address,
          gender: createFeedbackDto.gender,
          merchant_id: createFeedbackDto.merchantId,
          reward: createFeedbackDto.redirectCompleted || false,
        };

        if (createFeedbackDto.date_of_birth) {
          // Parse DD-MM-YYYY format to YYYY-MM-DD for PostgreSQL
          const dateStr = createFeedbackDto.date_of_birth.trim();
          const [day, month, year] = dateStr.split('-');
          
          // Validate date parts
          if (day && month && year && year.length === 4) {
            // Ensure proper padding
            const paddedDay = day.padStart(2, '0');
            const paddedMonth = month.padStart(2, '0');
            customerData.date_of_birth = `${year}-${paddedMonth}-${paddedDay}`;
          } else {
            throw new HttpException('Invalid date format. Expected DD-MM-YYYY', 400);
          }
        }

        const customer = queryRunner.manager.create(Customer, customerData);
        savedCustomer = await queryRunner.manager.save(customer);
      }

      // 3. Validate merchant and platform availability
      const merchant = await this.merchantRepository.findOne({
        where: { id: createFeedbackDto.merchantId },
      });

      if (!merchant) {
        throw new HttpException('Merchant not found', 404);
      }

      // Get merchant settings
      const merchantSettings = await this.merchantSettingRepository.findOne({
        where: { merchant_id: createFeedbackDto.merchantId },
      });

      if (!merchantSettings) {
        throw new HttpException('Merchant settings not found', 404);
      }

      // Validate selected platform is enabled by merchant
      const platformMap = {
        google: merchantSettings.enable_google_reviews,
        facebook: merchantSettings.enable_facebook_reviews,
        instagram: merchantSettings.enable_instagram_reviews,
        xiaohongshu: merchantSettings.enable_xiaohongshu_reviews,
      };

      if (!platformMap[createFeedbackDto.selectedPlatform]) {
        throw new HttpException(
          `${createFeedbackDto.selectedPlatform} reviews are not enabled for this merchant`,
          400,
        );
      }

      // 6. Validate and get review text
      let reviewText = '';
      if (createFeedbackDto.reviewType === 'preset') {
        if (!createFeedbackDto.presetReviewId) {
          throw new HttpException('Preset review ID is required for preset review type', 400);
        }

        const presetReview = await this.presetReviewRepository.findOne({
          where: { id: createFeedbackDto.presetReviewId, is_active: true },
        });

        if (!presetReview) {
          throw new HttpException('Preset review not found or inactive', 404);
        }

        // Verify preset review belongs to merchant or is system default
        if (
          presetReview.merchant_id !== null &&
          presetReview.merchant_id !== createFeedbackDto.merchantId &&
          !presetReview.is_system_default
        ) {
          throw new HttpException('Invalid preset review for this merchant', 400);
        }

        reviewText = presetReview.review_text;
      } else if (createFeedbackDto.reviewType === 'custom') {
        if (!createFeedbackDto.customReviewText?.trim()) {
          throw new HttpException('Custom review text is required for custom review type', 400);
        }
        reviewText = createFeedbackDto.customReviewText;
      }

      // 7. Create Feedback
      const feedback = queryRunner.manager.create(Feedback, {
        merchant_id: createFeedbackDto.merchantId,
        customer_id: savedCustomer.id,
        rating: createFeedbackDto.rating,
        comment: createFeedbackDto.comment,
        review_type: createFeedbackDto.reviewType,
        preset_review_id: createFeedbackDto.presetReviewId || null,
        review_text: reviewText,
        selected_platform: createFeedbackDto.selectedPlatform,
        redirect_completed: createFeedbackDto.redirectCompleted || false,
        coupon_batch_id: createFeedbackDto.coupon_batch_id || null,
      });
      const savedFeedback = await queryRunner.manager.save(feedback);

      // 8. Check luckydraw_enabled and find available coupon (but don't assign yet)
      let coupon: Coupon | null = null;
      let batch: CouponBatch | null = null;

      // Only find coupon if luckydraw is NOT enabled and whatsapp_enabled_for_batch_id is set
      if (!merchantSettings.luckydraw_enabled) {
        if (!merchantSettings.whatsapp_enabled_for_batch_id) {
          throw new HttpException('WhatsApp coupon batch is not configured for this merchant', 500);
        }
        batch = await this.couponBatchRepository.findOne({
          where: { 
            id: merchantSettings.whatsapp_enabled_for_batch_id,
            merchant_id: createFeedbackDto.merchantId,
            is_active: true
          },
        });
        console.log('Found coupon batch:', batch);

        if (batch) {
          if (batch.end_date < new Date()) {
            throw new HttpException('Coupon has expired', 404);
          }

          // Find available coupon with status='created' but DON'T assign yet
          coupon = await this.couponRepository.findOne({
            where: {
              batch_id: batch.id,
              status: 'created',
            },
            order: { created_at: 'ASC' },
          });

          if (!coupon) {
            throw new HttpException('No available coupons', 404);
          }
        }
      }

      await queryRunner.commitTransaction();

      // 9. Send WhatsApp coupon AFTER transaction commit and assign coupon ONLY if WhatsApp succeeds
      let whatsappSent = false;
      let whatsappCreditsInsufficient = false;
      let availableWhatsappCredits = 0;

      // Send WhatsApp message after transaction commit if coupon was found
      if (coupon && savedCustomer.phone && !merchantSettings.luckydraw_enabled) {
        // Check if merchant has WhatsApp credits before sending
        const creditCheck = await this.walletService.checkMerchantCredits(
          merchant.id,
          'whatsapp_ui',
          1,
        );

        if (creditCheck.hasCredits) {
          const expiryDate = new Date(batch!.end_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const message = `Hello ${savedCustomer.name}, thank you for your feedback at ${merchant.business_name}! Here's your coupon code ${coupon.coupon_code} valid until ${expiryDate}. Visit ${merchant.address || 'our location'} to redeem.`;

          try {
            // Feedback submission is UI message (user-initiated)
            await this.whatsappService.sendWhatsAppMessageWithCredits(
              merchant.id,
              savedCustomer.phone,
              message,
              WhatsAppMessageType.USER_INITIATED,
              WhatsAppCampaignType.FEEDBACK,
              coupon.id,
              savedCustomer.id,
            );

            whatsappSent = true;

            // ONLY NOW assign the coupon and increment quantity (after successful WhatsApp)
            const issuedAt = new Date();
            await this.couponRepository.update(coupon.id, {
              customer_id: savedCustomer.id,
              status: 'issued',
              issued_at: issuedAt,
              whatsapp_sent: true,
            });

            // Update the coupon object to reflect changes in the response
            coupon.customer_id = savedCustomer.id;
            coupon.status = 'issued';
            coupon.issued_at = issuedAt;
            coupon.whatsapp_sent = true;

            // Increment batch issued_quantity
            if (batch) {
              await this.couponBatchRepository.increment(
                { id: batch.id },
                'issued_quantity',
                1
              );
            }

            // Log successful WhatsApp message
            await this.systemLogService.logWhatsApp(
              SystemLogAction.MESSAGE_SENT,
              `Coupon sent via WhatsApp to ${savedCustomer.name}`,
              savedCustomer.id,
              {
                customer_id: savedCustomer.id,
                merchant_id: merchant.id,
                coupon_code: coupon.coupon_code,
                phone: savedCustomer.phone,
                context: 'feedback_submission',
              },
            );
          } catch (whatsappError) {
            // WhatsApp failed - coupon remains unassigned and available for next customer
            console.error(`WhatsApp send failed for customer ${savedCustomer.id}:`, whatsappError.message);
            
            // Set coupon to null since it wasn't successfully assigned
            coupon = null;

            // Log failed WhatsApp message
            await this.systemLogService.logWhatsApp(
              SystemLogAction.MESSAGE_FAILED,
              `Failed to send coupon via WhatsApp to ${savedCustomer.name}. Coupon not assigned.`,
              savedCustomer.id,
              {
                customer_id: savedCustomer.id,
                merchant_id: merchant.id,
                phone: savedCustomer.phone,
                error: whatsappError.message,
                context: 'feedback_submission',
                note: 'Coupon remains available in batch',
              },
            );
          }
        } else {
          // Insufficient credits - coupon not assigned
          whatsappCreditsInsufficient = true;
          availableWhatsappCredits = creditCheck.availableCredits;
          coupon = null; // Set to null since it wasn't assigned
          
          console.warn(`Merchant ${merchant.id} has insufficient WhatsApp UI credits. Available: ${creditCheck.availableCredits}. Feedback submitted but coupon not assigned.`);
          
          // Log the insufficient credits issue in system logs
          await this.systemLogService.logWallet(
            SystemLogAction.WARNING,
            `Insufficient WhatsApp UI credits for feedback coupon. Merchant: ${merchant.business_name}, Available: ${creditCheck.availableCredits}. Coupon not assigned.`,
            merchant.id,
            'merchant',
            0,
            {
              merchant_id: merchant.id,
              customer_id: savedCustomer.id,
              customer_phone: savedCustomer.phone,
              available_credits: creditCheck.availableCredits,
              required_credits: 1,
              context: 'feedback_submission_coupon',
              action: 'insufficient_credits',
              note: 'Coupon remains available in batch',
            },
          );
        }
      }

      // Load feedback with relations
      const feedbackWithRelations = await this.feedbackRepository.findOne({
        where: { id: savedFeedback.id },
        relations: ['merchant', 'customer', 'presetReview'],
      });

      // Log customer feedback submission
      await this.systemLogService.log({
        category: SystemLogCategory.CUSTOMER,
        action: SystemLogAction.CREATE,
        level: SystemLogLevel.INFO,
        message: `Customer ${savedCustomer.name} submitted feedback for ${merchant.business_name}`,
        userId: savedCustomer.id,
        userType: 'customer',
        entityType: 'feedback',
        entityId: savedFeedback.id,
        metadata: {
          merchant_id: createFeedbackDto.merchantId,
          customer_id: savedCustomer.id,
          is_new_customer: isNewCustomer,
          review_type: createFeedbackDto.reviewType,
          selected_platform: createFeedbackDto.selectedPlatform,
          redirect_completed: createFeedbackDto.redirectCompleted,
          coupon_sent: whatsappSent,
          coupon_code: coupon?.coupon_code,
        },
      });

      // Get redirect URL based on platform
      const redirectUrl = this.getRedirectUrl(merchantSettings, createFeedbackDto.selectedPlatform);

      return {
        message: isNewCustomer 
          ? 'Feedback created successfully. Customer account has been created.' 
          : 'Feedback created successfully. Using existing customer account.',
        data: {
          ...feedbackWithRelations,
          redirectUrl,
          customer: savedCustomer,
          coupon: coupon ? {
            id: coupon.id,
            status: coupon.status,
            whatsapp_sent: coupon.whatsapp_sent,
          } : null,
          luckydraw_enabled: merchantSettings.luckydraw_enabled,
          isNewCustomer,
          whatsapp_notification: {
            sent: whatsappSent,
            credits_insufficient: whatsappCreditsInsufficient,
            available_credits: whatsappCreditsInsufficient ? availableWhatsappCredits : undefined,
          },
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, merchantId?: number, customerId?: number, user?: { role: string; adminId?: number | null; merchantId?: number | null }) {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.merchant', 'merchant')
      .leftJoinAndSelect('feedback.customer', 'customer');

    if (merchantId) {
      queryBuilder.andWhere('feedback.merchant_id = :merchantId', { merchantId });
    }

    // If admin, filter by admin's merchants
    if (user && user.role === 'admin' && user.adminId) {
      queryBuilder.andWhere('merchant.admin_id = :adminId', { adminId: user.adminId });
    }

    // If merchant, filter by merchant's feedbacks
    if (user && user.role === 'merchant' && user.merchantId) {
      queryBuilder.andWhere('feedback.merchant_id = :userMerchantId', { userMerchantId: user.merchantId });
    }

    if (customerId) {
      queryBuilder.andWhere('feedback.customer_id = :customerId', { customerId });
    }

    queryBuilder
      .orderBy('feedback.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [feedbacks, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: feedbacks,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number, user?: { role: string; adminId?: number | null; merchantId?: number | null }) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }

    // If admin, check if merchant belongs to admin
    if (user && user.role === 'admin' && user.adminId && feedback.merchant.admin_id !== user.adminId) {
      throw new HttpException('Feedback not found', 404);
    }

    // If merchant, check if feedback belongs to merchant
    if (user && user.role === 'merchant' && user.merchantId && feedback.merchant_id !== user.merchantId) {
      throw new HttpException('Feedback not found', 404);
    }

    return {
      message: 'Success fetching feedback',
      data: feedback,
    };
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }

    await this.feedbackRepository.update(id, updateFeedbackDto);
    const updatedFeedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });
    
    return {
      message: 'Feedback updated successfully',
      data: updatedFeedback,
    };
  }

  async remove(id: number) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }
    await this.feedbackRepository.softDelete(id);
    return {
      message: 'Feedback deleted successfully',
    };
  }

  private getRedirectUrl(settings: MerchantSetting, platform: string): string {
    const urlMap = {
      google: settings.google_review_url,
      facebook: settings.facebook_page_url,
      instagram: settings.instagram_url,
      xiaohongshu: settings.xiaohongshu_url,
    };

    return urlMap[platform] || '';
  }

  async markRedirectCompleted(feedbackId: number) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
      relations: ['customer'],
    });

    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }

    feedback.redirect_completed = true;
    await this.feedbackRepository.save(feedback);

    // Update customer reward to true
    if (feedback.customer) {
      feedback.customer.reward = true;
      await this.customerRepository.update(feedback.customer.id, { reward: true });
    }
 
    return {
      message: 'Redirect marked as completed and customer rewarded',
      data: feedback,
    };
  }

  async getReviewAnalytics(merchantId: number) {
    const totalReviews = await this.feedbackRepository.count({
      where: { merchant_id: merchantId },
    });

    const presetReviews = await this.feedbackRepository.count({
      where: { merchant_id: merchantId, review_type: 'preset' },
    });

    const customReviews = await this.feedbackRepository.count({
      where: { merchant_id: merchantId, review_type: 'custom' },
    });

    const completedRedirects = await this.feedbackRepository.count({
      where: { merchant_id: merchantId, redirect_completed: true },
    });

    const platformStats = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('feedback.selected_platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('feedback.merchant_id = :merchantId', { merchantId })
      .groupBy('feedback.selected_platform')
      .getRawMany();

    return {
      message: 'Review analytics retrieved successfully',
      data: {
        totalReviews,
        presetReviews,
        customReviews,
        completedRedirects,
        redirectCompletionRate: totalReviews > 0 ? (completedRedirects / totalReviews) * 100 : 0,
        platformStats,
      },
    };
  }

//   async checkCustomerByPhone(phone: string) {
//   if (!phone?.trim()) {
//     throw new HttpException('Phone number is required', 400);
//   }

//   const normalizedPhone = this.normalizePhone(phone);

//   const customer = await this.customerRepository
//     .createQueryBuilder('customer')
//     .where(
//       `
//         REGEXP_REPLACE(customer.phone, '[^0-9]', '', 'g')
//         LIKE :phone
//       `,
//       { phone: `%${normalizedPhone}%` },
//     )
//     .getOne();

//   if (!customer) {
//     return {
//       message: 'Customer not found',
//       data: null,
//     };
//   }

//   return {
//     message: 'Customer found',
//     data: {
//       name: customer.name,
//       email: customer.email,
//       phone: customer.phone,
//       address: customer.address,
//       gender: customer.gender,
//       date_of_birth: this.formatDate(customer.date_of_birth),
//     },
//   };
// }



private normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

private formatDate(date: Date | null): string | null {
  if (!date) return null;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

}
