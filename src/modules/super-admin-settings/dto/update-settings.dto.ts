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

  @IsOptional()
  @IsString()
  currency?: string;
}
