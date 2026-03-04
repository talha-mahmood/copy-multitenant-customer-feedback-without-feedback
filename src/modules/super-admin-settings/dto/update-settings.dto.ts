import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSuperAdminSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  admin_annual_subscription_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  merchant_annual_fee?: number;

  // Platform Costs
  @IsOptional()
  @IsNumber()
  @Min(0)
  merchant_annual_platform_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  whatsapp_bi_platform_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  whatsapp_ui_annual_platform_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  whatsapp_ui_temporary_platform_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coupon_annual_platform_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coupon_temporary_platform_cost?: number;

  // Homepage Placement Settings
  @IsOptional()
  @IsNumber()
  @Min(0)
  homepage_coupon_placement_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  homepage_ad_placement_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_homepage_coupons?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_homepage_ads?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  coupon_homepage_placement_duration_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  ad_homepage_placement_duration_days?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
