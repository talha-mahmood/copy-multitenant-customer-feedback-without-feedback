import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateSuperAdminSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  admin_subscription_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temporary_merchant_commission_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  annual_merchant_commission_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  merchant_annual_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  admin_annual_commission_rate?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
