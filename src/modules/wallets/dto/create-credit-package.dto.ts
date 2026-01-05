import { IsString, IsInt, IsNumber, IsOptional, IsIn, Min, IsBoolean } from 'class-validator';

export class CreateCreditPackageDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  credits: number;

  @IsString()
  @IsIn(['marketing', 'utility', 'general'])
  credit_type: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  price_per_credit: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  @IsIn(['annual', 'temporary', 'all'])
  merchant_type?: string;

  @IsInt()
  admin_id: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsInt()
  @IsOptional()
  bonus_credits?: number;
}
