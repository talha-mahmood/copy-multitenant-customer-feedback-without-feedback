import { IsString, IsInt, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { IsUnique } from '../../../common/decorators/is-unique.decorator';
import { Exists } from '../../../common/decorators/exists.decorator';
import { Coupon } from '../entities/coupon.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { CouponTemplate } from '../entities/coupon-template.entity';

export class CreateCouponDto {
  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsInt()
  batch_id: number;

  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsInt()
  merchant_id: number;

  @Exists(() => Customer, 'id', { message: 'Customer must exist' })
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
  @Exists(() => CouponTemplate, 'id', { message: 'Coupon Template must exist' })
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
