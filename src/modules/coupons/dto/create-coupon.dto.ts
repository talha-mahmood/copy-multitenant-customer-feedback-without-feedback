import { IsString, IsInt, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { IsUnique } from '../../../common/decorators/is-unique.decorator';
import { Coupon } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsInt()
  batch_id: number;

  @IsInt()
  merchant_id: number;

  @IsInt()
  @IsOptional()
  customer_id?: number;

  @IsUnique(() => Coupon, 'coupon_code')
  @IsString()
  coupon_code: string;

  @IsString()
  @IsOptional()
  qr_hash?: string;

  @IsString()
  @IsOptional()
  @IsIn(['created', 'issued', 'redeemed', 'expired'])
  status?: string;
  @IsInt()
  @IsOptional()
  template_id?: number;

  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  ishalal?: boolean;
}
