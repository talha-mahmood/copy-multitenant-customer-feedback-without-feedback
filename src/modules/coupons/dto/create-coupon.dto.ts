import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCouponDto {
  @IsInt()
  batch_id: number;

  @IsInt()
  merchant_id: number;

  @IsInt()
  @IsOptional()
  customer_id?: number;

  @IsString()
  coupon_code: string;

  @IsString()
  @IsOptional()
  qr_hash?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
