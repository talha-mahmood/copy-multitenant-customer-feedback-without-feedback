import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerchantSetting } from './entities/merchant-setting.entity';
import { CreateMerchantSettingDto } from './dto/create-merchant-setting.dto';
import { UpdateMerchantSettingDto } from './dto/update-merchant-setting.dto';
import { uploadFile } from 'src/common/helpers/file-upload.helper';
import { FileUploadStorageType } from 'src/common/enums/file-upload-storage-type.enum';
import { Merchant } from '../merchants/entities/merchant.entity';

@Injectable()
export class MerchantSettingService {
  constructor(
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
  ) { }

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
      placement: updateMerchantSettingDto.placement ?? setting.placement,
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

  async uploadPaidAdImage(merchantId: number, paidAdImage: any) {
    const setting = await this.merchantSettingRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!setting) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    const uploadResult = await uploadFile(
      paidAdImage,
      'merchant-ads',
      FileUploadStorageType.LOCAL_STORAGE,
    );

    setting.paid_ad_image = uploadResult.relativePath;
    const updated = await this.merchantSettingRepository.save(setting);

    return {
      message: 'Paid ad image uploaded successfully',
      data: {
        paid_ad_image: updated.paid_ad_image,
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
