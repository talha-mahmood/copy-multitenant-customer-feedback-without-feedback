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
import { WhatsAppService } from 'src/common/services/whatsapp.service';
import { randomBytes } from 'crypto';

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
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check if customer already exists
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: createFeedbackDto.email },
      });

      if (existingCustomer) {
        throw new HttpException('Customer with this email already exists', 400);
      }

      // 2. Create Customer
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
        // Parse DD-MM-YYYY format to YYYY-MM-DD
        const [day, month, year] = createFeedbackDto.date_of_birth.split('-');
        customerData.date_of_birth = `${year}-${month}-${day}`;
      }

      const customer = queryRunner.manager.create(Customer, customerData);
      const savedCustomer = await queryRunner.manager.save(customer);

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

      // 8. Check luckydraw_enabled and send coupon if needed
      let coupon: Coupon | null = null;
      let whatsappSent = false;

      // Only send coupon directly if luckydraw is NOT enabled
      if (!merchantSettings.luckydraw_enabled) {
        const batch = await this.couponBatchRepository.findOne({
          where: { whatsapp_enabled: true, is_active: true},
        });
        console.log('Found coupon batch:', batch);

        if (batch) {
          // Find available coupon with status='created'
          coupon = await this.couponRepository.findOne({
            where: {
              batch_id: batch.id,
              status: 'created',
            },
            order: { created_at: 'ASC' },
          });

          if (coupon) {

            if( batch.end_date < new Date()) {
              throw new HttpException('Coupon has expired', 404);
            }
            // Update coupon: assign to customer and mark as issued
            coupon.customer_id = savedCustomer.id;
            coupon.status = 'issued';
            coupon.issued_at = new Date();

            // Send coupon via WhatsApp
            if (savedCustomer.phone) {
              const expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              const message = `Hello ${savedCustomer.name}, thank you for your feedback at ${merchant.business_name}! Here's your coupon code ${coupon.coupon_code} valid until ${expiryDate}. Visit ${merchant.address || 'our location'} to redeem.`;

              const whatsappResult = await this.whatsappService.sendGeneralMessage(
                savedCustomer.phone,
                message,
              );

              if (whatsappResult.success) {
                whatsappSent = true;
                coupon.whatsapp_sent = true;
              }
            }

            // Save updated coupon
            await queryRunner.manager.save(coupon);

            // Increment batch issued_quantity
            batch.issued_quantity += 1;
            await queryRunner.manager.save(batch);
          }
          else {
            throw new HttpException('No available coupons', 404);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Load feedback with relations
      const feedbackWithRelations = await this.feedbackRepository.findOne({
        where: { id: savedFeedback.id },
        relations: ['merchant', 'customer', 'presetReview'],
      });

      // Get redirect URL based on platform
      const redirectUrl = this.getRedirectUrl(merchantSettings, createFeedbackDto.selectedPlatform);

      return {
        message: 'Feedback created successfully. Customer account has been created.',
        data: {
          ...feedbackWithRelations,
          redirectUrl,
          coupon: coupon ? {
            id: coupon.id,
            coupon_code: coupon.coupon_code,
            status: coupon.status,
            whatsapp_sent: coupon.whatsapp_sent,
          } : null,
          luckydraw_enabled: merchantSettings.luckydraw_enabled,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, merchantId?: number, customerId?: number) {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.merchant', 'merchant')
      .leftJoinAndSelect('feedback.customer', 'customer');

    if (merchantId) {
      queryBuilder.andWhere('feedback.merchant_id = :merchantId', { merchantId });
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

  async findOne(id: number) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });
    if (!feedback) {
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
}
