import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateSuperAdminSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  admin_annual_subscription_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temporary_merchant_packages_admin_commission_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  annual_merchant_packages_admin_commission_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  merchant_annual_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  annual_merchant_subscription_admin_commission_rate?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
