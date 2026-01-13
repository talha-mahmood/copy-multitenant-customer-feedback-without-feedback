import { IsString, IsInt, IsNumber, IsOptional, IsIn, Min, Max, IsBoolean } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

export class CreateLuckyDrawPrizeDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsInt()
  merchant_id: number;

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsInt()
  @IsOptional()
  batch_id?: number;

  @IsString()
  prize_name: string;

  @IsString()
  @IsOptional()
  prize_description?: string;

  @IsString()
  @IsIn(['coupon', 'discount', 'free_item', 'no_prize'])
  prize_type: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  probability: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  daily_limit?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  total_limit?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}
