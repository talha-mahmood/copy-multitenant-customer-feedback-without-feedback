import { IsString, IsInt, IsDate, IsBoolean, IsIn, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponTemplate } from 'src/modules/coupons/entities/coupon-template.entity';

export class CreateCouponBatchDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsInt()
  merchant_id: number;

  @IsString()
  batch_name: string;

  @IsString()
  @IsIn(['annual', 'temporary'])
  batch_type: string;

  @IsInt()
  @Min(1)
  total_quantity: number;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

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
  whatsapp_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  lucky_draw_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  ishalal?: boolean;

  @IsBoolean()
  @IsOptional()
  visibility?: boolean;

  @IsString()
  brand_image: string;

}
