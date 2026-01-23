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
        temporary_merchant_packages_admin_commission_rate: 0.20,
        annual_merchant_packages_admin_commission_rate: 0.02,
        merchant_annual_fee: 1199.00,
        annual_merchant_subscription_admin_commission_rate: 0.75,
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
    if (updateDto.temporary_merchant_packages_admin_commission_rate !== undefined) {
      settings.temporary_merchant_packages_admin_commission_rate = updateDto.temporary_merchant_packages_admin_commission_rate;
    }
    if (updateDto.annual_merchant_packages_admin_commission_rate !== undefined) {
      settings.annual_merchant_packages_admin_commission_rate = updateDto.annual_merchant_packages_admin_commission_rate;
    }
    if (updateDto.merchant_annual_fee !== undefined) {
      settings.merchant_annual_fee = updateDto.merchant_annual_fee;
    }
    if (updateDto.annual_merchant_subscription_admin_commission_rate !== undefined) {
      settings.annual_merchant_subscription_admin_commission_rate = updateDto.annual_merchant_subscription_admin_commission_rate;
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
   * Get commission settings (public)
   */
  async getCommissionSettings(): Promise<{
    temporaryMerchantPackagesAdminCommissionRate: number;
    annualMerchantPackagesAdminCommissionRate: number;
    merchantAnnualFee: number;
    annualMerchantSubscriptionAdminCommissionRate: number;
    currency: string;
  }> {
    const settings = await this.getSettings();
    return {
      temporaryMerchantPackagesAdminCommissionRate: parseFloat(settings.temporary_merchant_packages_admin_commission_rate.toString()),
      annualMerchantPackagesAdminCommissionRate: parseFloat(settings.annual_merchant_packages_admin_commission_rate.toString()),
      merchantAnnualFee: parseFloat(settings.merchant_annual_fee.toString()),
      annualMerchantSubscriptionAdminCommissionRate: parseFloat(settings.annual_merchant_subscription_admin_commission_rate.toString()),
      currency: settings.currency,
    };
  }
}
