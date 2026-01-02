import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerchantSetting } from './entities/merchant-setting.entity';
import { CreateMerchantSettingDto } from './dto/create-merchant-setting.dto';
import { UpdateMerchantSettingDto } from './dto/update-merchant-setting.dto';

@Injectable()
export class MerchantSettingService {
  constructor(
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
  ) {}

  async create(createMerchantSettingDto: CreateMerchantSettingDto) {
    // Check if settings already exist for this merchant
    const existing = await this.merchantSettingRepository.findOne({
      where: { merchant_id: createMerchantSettingDto.merchantId },
    });

    if (existing) {
      return {
        message: 'Settings already exist for this merchant. Use update instead.',
        data: existing,
      };
    }

    const setting = this.merchantSettingRepository.create({
      merchant_id: createMerchantSettingDto.merchantId,
      enable_preset_reviews: createMerchantSettingDto.enablePresetReviews ?? true,
      enable_google_reviews: createMerchantSettingDto.enableGoogleReviews ?? true,
      enable_facebook_reviews: createMerchantSettingDto.enableFacebookReviews ?? false,
      enable_instagram_reviews: createMerchantSettingDto.enableInstagramReviews ?? false,
      enable_xiaohongshu_reviews: createMerchantSettingDto.enableXiaohongshuReviews ?? false,
      google_review_url: createMerchantSettingDto.googleReviewUrl,
      facebook_page_url: createMerchantSettingDto.facebookPageUrl,
      instagram_url: createMerchantSettingDto.instagramUrl,
      xiaohongshu_url: createMerchantSettingDto.xiaohongshuUrl,
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

    Object.assign(setting, {
      enable_preset_reviews: updateMerchantSettingDto.enablePresetReviews ?? setting.enable_preset_reviews,
      enable_google_reviews: updateMerchantSettingDto.enableGoogleReviews ?? setting.enable_google_reviews,
      enable_facebook_reviews: updateMerchantSettingDto.enableFacebookReviews ?? setting.enable_facebook_reviews,
      enable_instagram_reviews: updateMerchantSettingDto.enableInstagramReviews ?? setting.enable_instagram_reviews,
      enable_xiaohongshu_reviews: updateMerchantSettingDto.enableXiaohongshuReviews ?? setting.enable_xiaohongshu_reviews,
      google_review_url: updateMerchantSettingDto.googleReviewUrl ?? setting.google_review_url,
      facebook_page_url: updateMerchantSettingDto.facebookPageUrl ?? setting.facebook_page_url,
      instagram_url: updateMerchantSettingDto.instagramUrl ?? setting.instagram_url,
      xiaohongshu_url: updateMerchantSettingDto.xiaohongshuUrl ?? setting.xiaohongshu_url,
    });

    const updated = await this.merchantSettingRepository.save(setting);

    return {
      message: 'Merchant settings updated successfully',
      data: updated,
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
