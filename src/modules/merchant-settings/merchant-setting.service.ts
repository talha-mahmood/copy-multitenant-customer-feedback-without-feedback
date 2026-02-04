import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerchantSetting } from './entities/merchant-setting.entity';
import { CreateMerchantSettingDto } from './dto/create-merchant-setting.dto';
import { UpdateMerchantSettingDto } from './dto/update-merchant-setting.dto';
import { uploadFile } from 'src/common/helpers/file-upload.helper';
import { FileUploadStorageType } from 'src/common/enums/file-upload-storage-type.enum';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { WalletService } from '../wallets/wallet.service';
import { ApprovalService } from '../approvals/approval.service';
import { SUPER_ADMIN_SETTINGS_REPOSITORY } from '../super-admin-settings/super-admin-settings.provider';
import { SuperAdminSettings } from '../super-admin-settings/entities/super-admin-settings.entity';

@Injectable()
export class MerchantSettingService {
  constructor(
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    private walletService: WalletService,
    private approvalService: ApprovalService,
    @Inject(SUPER_ADMIN_SETTINGS_REPOSITORY)
    private superAdminSettingsRepository: Repository<SuperAdminSettings>,
  ) { }

  async getSubscriptionFee() {
    const settings = await this.superAdminSettingsRepository.findOne({
      where: { is_active: true },
    });

    if (!settings) {
      throw new NotFoundException('Super admin settings not found');
    }

    return {
      fee: settings.merchant_annual_fee,
      currency: settings.currency,
    };
  }

  async create(createMerchantSettingDto: CreateMerchantSettingDto) {
    // Check if settings already exist for this merchant
    const existing = await this.merchantSettingRepository.findOne({
      where: { merchant_id: createMerchantSettingDto.merchant_id },
    });

    if (existing) {
      return {
        message: 'Settings already exist for this merchant. Use update instead.',
        data: existing,
      };
    }

    // Validate whatsapp_enabled_for_batch_id belongs to merchant
    if (createMerchantSettingDto.whatsapp_enabled_for_batch_id) {
      const whatsappBatch = await this.couponBatchRepository.findOne({
        where: {
          id: createMerchantSettingDto.whatsapp_enabled_for_batch_id,
          merchant_id: createMerchantSettingDto.merchant_id,
        },
      });

      if (!whatsappBatch) {
        throw new BadRequestException(
          `Coupon batch ID ${createMerchantSettingDto.whatsapp_enabled_for_batch_id} does not exist or does not belong to merchant ID ${createMerchantSettingDto.merchant_id}`
        );
      }
    }

    // Validate birthday_coupon_batch_id belongs to merchant
    if (createMerchantSettingDto.birthday_coupon_batch_id) {
      const birthdayBatch = await this.couponBatchRepository.findOne({
        where: {
          id: createMerchantSettingDto.birthday_coupon_batch_id,
          merchant_id: createMerchantSettingDto.merchant_id,
        },
      });

      if (!birthdayBatch) {
        throw new BadRequestException(
          `Coupon batch ID ${createMerchantSettingDto.birthday_coupon_batch_id} does not exist or does not belong to merchant ID ${createMerchantSettingDto.merchant_id}`
        );
      }
    }

    const setting = this.merchantSettingRepository.create({
      merchant_id: createMerchantSettingDto.merchant_id,
      enable_preset_reviews: createMerchantSettingDto.enable_preset_reviews ?? true,
      enable_google_reviews: createMerchantSettingDto.enable_google_reviews ?? true,
      enable_facebook_reviews: createMerchantSettingDto.enable_facebook_reviews ?? false,
      enable_instagram_reviews: createMerchantSettingDto.enable_instagram_reviews ?? false,
      enable_xiaohongshu_reviews: createMerchantSettingDto.enable_xiaohongshu_reviews ?? false,
      google_review_url: createMerchantSettingDto.google_review_url,
      facebook_page_url: createMerchantSettingDto.facebook_page_url,
      instagram_url: createMerchantSettingDto.instagram_url,
      xiaohongshu_url: createMerchantSettingDto.xiaohongshu_url,
      paid_ads: createMerchantSettingDto.paid_ads ?? false,
    });

    const saved = await this.merchantSettingRepository.save(setting);

    return {
      message: 'Merchant settings created successfully',
      data: saved,
    };
  }

  async findByMerchantId(merchantId: number) {
    const setting = await this.merchantSettingRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!setting) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    return {
      message: 'Merchant settings retrieved successfully',
      data: setting,
    };
  }

  async update(merchantId: number, updateMerchantSettingDto: UpdateMerchantSettingDto) {
    const setting = await this.merchantSettingRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!setting) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    // Validate whatsapp_enabled_for_batch_id belongs to merchant
    if (updateMerchantSettingDto.whatsapp_enabled_for_batch_id !== undefined) {
      if (updateMerchantSettingDto.whatsapp_enabled_for_batch_id !== null) {
        const whatsappBatch = await this.couponBatchRepository.findOne({
          where: {
            id: updateMerchantSettingDto.whatsapp_enabled_for_batch_id,
            merchant_id: merchantId,
          },
        });

        if (!whatsappBatch) {
          throw new BadRequestException(
            `Coupon batch ID ${updateMerchantSettingDto.whatsapp_enabled_for_batch_id} does not exist or does not belong to merchant ID ${merchantId}`
          );
        }
      }
    }

    // Validate birthday_coupon_batch_id belongs to merchant
    if (updateMerchantSettingDto.birthday_coupon_batch_id !== undefined) {
      if (updateMerchantSettingDto.birthday_coupon_batch_id !== null) {
        const birthdayBatch = await this.couponBatchRepository.findOne({
          where: {
            id: updateMerchantSettingDto.birthday_coupon_batch_id,
            merchant_id: merchantId,
          },
        });

        if (!birthdayBatch) {
          throw new BadRequestException(
            `Coupon batch ID ${updateMerchantSettingDto.birthday_coupon_batch_id} does not exist or does not belong to merchant ID ${merchantId}`
          );
        }
      }
    }

    // Validate inactive_recall_coupon_batch_id belongs to merchant
    if (updateMerchantSettingDto.inactive_recall_coupon_batch_id !== undefined) {
      if (updateMerchantSettingDto.inactive_recall_coupon_batch_id !== null) {
        const inactiveBatch = await this.couponBatchRepository.findOne({
          where: {
            id: updateMerchantSettingDto.inactive_recall_coupon_batch_id,
            merchant_id: merchantId,
          },
        });

        if (!inactiveBatch) {
          throw new BadRequestException(
            `Coupon batch ID ${updateMerchantSettingDto.inactive_recall_coupon_batch_id} does not exist or does not belong to merchant ID ${merchantId}`
          );
        }
      }
    }

    // Check if paid_ads is being turned on (from false to true)
    if (updateMerchantSettingDto.paid_ads === true && setting.paid_ads === false) {
      // Check if merchant has paid ad credits
      const { hasCredits, availableCredits } = await this.walletService.checkMerchantCredits(
        merchantId,
        'paid ads',
        1,
      );

      if (!hasCredits) {
        throw new BadRequestException(
          `Insufficient paid ad credits. You need at least 1 paid ad credit to enable paid ads. Available: ${availableCredits}`,
        );
      }

      // Deduct the paid ad credit
      await this.walletService.deductPaidAdCredit(merchantId);
    }

    Object.assign(setting, {
      enable_preset_reviews: updateMerchantSettingDto.enable_preset_reviews ?? setting.enable_preset_reviews,
      enable_google_reviews: updateMerchantSettingDto.enable_google_reviews ?? setting.enable_google_reviews,
      enable_facebook_reviews: updateMerchantSettingDto.enable_facebook_reviews ?? setting.enable_facebook_reviews,
      enable_instagram_reviews: updateMerchantSettingDto.enable_instagram_reviews ?? setting.enable_instagram_reviews,
      enable_xiaohongshu_reviews: updateMerchantSettingDto.enable_xiaohongshu_reviews ?? setting.enable_xiaohongshu_reviews,
      google_review_url: updateMerchantSettingDto.google_review_url ?? setting.google_review_url,
      facebook_page_url: updateMerchantSettingDto.facebook_page_url ?? setting.facebook_page_url,
      instagram_url: updateMerchantSettingDto.instagram_url ?? setting.instagram_url,
      xiaohongshu_url: updateMerchantSettingDto.xiaohongshu_url ?? setting.xiaohongshu_url,
      paid_ads: updateMerchantSettingDto.paid_ads ?? setting.paid_ads,
      paid_ad_placement: updateMerchantSettingDto.paid_ad_placement ?? setting.paid_ad_placement,
      placement: updateMerchantSettingDto.placement ?? setting.placement,
      luckydraw_enabled: updateMerchantSettingDto.luckydraw_enabled ?? setting.luckydraw_enabled,
      whatsapp_enabled_for_batch_id: updateMerchantSettingDto.whatsapp_enabled_for_batch_id ?? setting.whatsapp_enabled_for_batch_id,
      birthday_message_enabled: updateMerchantSettingDto.birthday_message_enabled ?? setting.birthday_message_enabled,
      days_before_birthday: updateMerchantSettingDto.days_before_birthday ?? setting.days_before_birthday,
      days_after_birthday: updateMerchantSettingDto.days_after_birthday ?? setting.days_after_birthday,
      birthday_coupon_batch_id: updateMerchantSettingDto.birthday_coupon_batch_id ?? setting.birthday_coupon_batch_id,
      inactive_recall_enabled: updateMerchantSettingDto.inactive_recall_enabled ?? setting.inactive_recall_enabled,
      inactive_recall_days: updateMerchantSettingDto.inactive_recall_days ?? setting.inactive_recall_days,
      inactive_recall_coupon_batch_id: updateMerchantSettingDto.inactive_recall_coupon_batch_id ?? setting.inactive_recall_coupon_batch_id,
      festival_campaign_enabled: updateMerchantSettingDto.festival_campaign_enabled ?? setting.festival_campaign_enabled,
      scheduled_campaign_enabled: updateMerchantSettingDto.scheduled_campaign_enabled ?? setting.scheduled_campaign_enabled,
    });

    const updated = await this.merchantSettingRepository.save(setting);

    // Update paid_ads and placement in merchant table as well
    const merchantUpdates: any = {};
    if (updateMerchantSettingDto.paid_ads !== undefined) {
      merchantUpdates.paid_ads = updateMerchantSettingDto.paid_ads;
    }
    if (updateMerchantSettingDto.placement !== undefined) {
      merchantUpdates.placement = updateMerchantSettingDto.placement;
    }
    if (Object.keys(merchantUpdates).length > 0) {
      await this.merchantRepository.update(
        { id: merchantId },
        merchantUpdates
      );
    }

    return {
      message: 'Merchant settings updated successfully',
      data: updated,
    };
  }

  async uploadPaidAdImage(merchantId: number, paidAdImage: any, paidAdPlacement?: string) {
    const setting = await this.merchantSettingRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!setting) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    // Get merchant to retrieve admin_id
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
    }

    const timestamp = Date.now();
    const uploadResult = await uploadFile(
      paidAdImage,
      `merchant-ads/${merchantId}/${timestamp}`,
      FileUploadStorageType.LOCAL_STORAGE,
    );

    setting.paid_ad_image = uploadResult.relativePath;
    if (paidAdPlacement) {
      setting.paid_ad_placement = paidAdPlacement;
    }

    const updated = await this.merchantSettingRepository.save(setting);

    // Create approval record with merchant's admin_id as agent_id
    const approval = await this.approvalService.create({
      merchant_id: merchantId,
      approval_type: 'paid_ad',
      approval_owner: 'agent',
      agent_id: merchant.admin_id, // Set the admin who created this merchant
      request_from: 'merchant',
      approval_status: 'pending',
    });

    return {
      message: 'Paid ad image uploaded successfully and approval request created',
      data: {
        paid_ad_image: updated.paid_ad_image,
        paid_ad_placement: updated.paid_ad_placement,
        approval: approval,
      },
    };
  }

  async remove(merchantId: number) {
    const setting = await this.merchantSettingRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!setting) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    await this.merchantSettingRepository.softDelete(setting.id);

    return {
      message: 'Merchant settings deleted successfully',
      data: null,
    };
  }

  async createDefaultSettings(merchantId: number, manager?: any) {
    const repository = manager ? manager.getRepository('MerchantSetting') : this.merchantSettingRepository;

    const existing = await repository.findOne({
      where: { merchant_id: merchantId },
    });

    if (existing) {
      return existing;
    }

    const setting = repository.create({
      merchant_id: merchantId,
      enable_preset_reviews: true,
      enable_google_reviews: true,
      enable_facebook_reviews: false,
      enable_instagram_reviews: false,
      enable_xiaohongshu_reviews: false,
    });

    return await repository.save(setting);
  }
}
