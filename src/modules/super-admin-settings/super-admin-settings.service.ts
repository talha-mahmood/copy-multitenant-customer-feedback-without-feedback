import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SuperAdminSettings } from './entities/super-admin-settings.entity';
import { SUPER_ADMIN_SETTINGS_REPOSITORY } from './super-admin-settings.provider';
import { UpdateSuperAdminSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SuperAdminSettingsService {
  constructor(
    @Inject(SUPER_ADMIN_SETTINGS_REPOSITORY)
    private settingsRepository: Repository<SuperAdminSettings>,
  ) {}

  /**
   * Get super admin settings (creates default if doesn't exist)
   */
  async getSettings(): Promise<SuperAdminSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { is_active: true },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = this.settingsRepository.create({
        admin_annual_subscription_fee: 1199.00,
        merchant_annual_fee: 1199.00,
        merchant_annual_platform_cost: 299.00,
        whatsapp_bi_platform_cost: 0.45,
        whatsapp_ui_annual_platform_cost: 0.12,
        whatsapp_ui_temporary_platform_cost: 0.12,
        coupon_annual_platform_cost: 0.05,
        coupon_temporary_platform_cost: 0.05,
        homepage_coupon_placement_cost: 50.00,
        homepage_ad_placement_cost: 100.00,
        max_homepage_coupons: 10,
        max_homepage_ads: 4,
        coupon_homepage_placement_duration_days: 7,
        ad_homepage_placement_duration_days: 7,
        currency: 'USD',
        is_active: true,
      });
      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * Update super admin settings
   */
  async updateSettings(updateDto: UpdateSuperAdminSettingsDto): Promise<SuperAdminSettings> {
    const settings = await this.getSettings();

    if (updateDto.admin_annual_subscription_fee !== undefined) {
      settings.admin_annual_subscription_fee = updateDto.admin_annual_subscription_fee;
    }
    if (updateDto.merchant_annual_fee !== undefined) {
      settings.merchant_annual_fee = updateDto.merchant_annual_fee;
    }
    if (updateDto.merchant_annual_platform_cost !== undefined) {
      settings.merchant_annual_platform_cost = updateDto.merchant_annual_platform_cost;
    }
    if (updateDto.whatsapp_bi_platform_cost !== undefined) {
      settings.whatsapp_bi_platform_cost = updateDto.whatsapp_bi_platform_cost;
    }
    if (updateDto.whatsapp_ui_annual_platform_cost !== undefined) {
      settings.whatsapp_ui_annual_platform_cost = updateDto.whatsapp_ui_annual_platform_cost;
    }
    if (updateDto.whatsapp_ui_temporary_platform_cost !== undefined) {
      settings.whatsapp_ui_temporary_platform_cost = updateDto.whatsapp_ui_temporary_platform_cost;
    }
    if (updateDto.coupon_annual_platform_cost !== undefined) {
      settings.coupon_annual_platform_cost = updateDto.coupon_annual_platform_cost;
    }
    if (updateDto.coupon_temporary_platform_cost !== undefined) {
      settings.coupon_temporary_platform_cost = updateDto.coupon_temporary_platform_cost;
    }
    if (updateDto.homepage_coupon_placement_cost !== undefined) {
      settings.homepage_coupon_placement_cost = updateDto.homepage_coupon_placement_cost;
    }
    if (updateDto.homepage_ad_placement_cost !== undefined) {
      settings.homepage_ad_placement_cost = updateDto.homepage_ad_placement_cost;
    }
    if (updateDto.max_homepage_coupons !== undefined) {
      settings.max_homepage_coupons = updateDto.max_homepage_coupons;
    }
    if (updateDto.max_homepage_ads !== undefined) {
      settings.max_homepage_ads = updateDto.max_homepage_ads;
    }
    if (updateDto.coupon_homepage_placement_duration_days !== undefined) {
      settings.coupon_homepage_placement_duration_days = updateDto.coupon_homepage_placement_duration_days;
    }
    if (updateDto.ad_homepage_placement_duration_days !== undefined) {
      settings.ad_homepage_placement_duration_days = updateDto.ad_homepage_placement_duration_days;
    }
    if (updateDto.currency !== undefined) {
      settings.currency = updateDto.currency;
    }

    return await this.settingsRepository.save(settings);
  }

  /**
   * Get admin subscription fee (public)
   */
  async getAdminSubscriptionFee(): Promise<{ fee: number; currency: string }> {
    const settings = await this.getSettings();
    return {
      fee: parseFloat(settings.admin_annual_subscription_fee.toString()),
      currency: settings.currency,
    };
  }

  /**
   * Get platform cost settings (public)
   */
  async getPlatformCostSettings(): Promise<{
    merchantAnnualPlatformCost: number;
    whatsappBiPlatformCost: number;
    whatsappUiAnnualPlatformCost: number;
    whatsappUiTemporaryPlatformCost: number;
    couponAnnualPlatformCost: number;
    couponTemporaryPlatformCost: number;
    merchantAnnualFee: number;
    currency: string;
  }> {
    const settings = await this.getSettings();
    return {
      merchantAnnualPlatformCost: parseFloat(settings.merchant_annual_platform_cost.toString()),
      whatsappBiPlatformCost: parseFloat(settings.whatsapp_bi_platform_cost.toString()),
      whatsappUiAnnualPlatformCost: parseFloat(settings.whatsapp_ui_annual_platform_cost.toString()),
      whatsappUiTemporaryPlatformCost: parseFloat(settings.whatsapp_ui_temporary_platform_cost.toString()),
      couponAnnualPlatformCost: parseFloat(settings.coupon_annual_platform_cost.toString()),
      couponTemporaryPlatformCost: parseFloat(settings.coupon_temporary_platform_cost.toString()),
      merchantAnnualFee: parseFloat(settings.merchant_annual_fee.toString()),
      currency: settings.currency,
    };
  }
}
