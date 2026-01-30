import { IsNotEmpty, IsString, IsDateString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

export class CreateFestivalMessageDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsNotEmpty()
  @IsInt()
  merchant_id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  festival_name: string;

  @IsNotEmpty()
  @IsDateString()
  festival_date: string; // Format: YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsInt()
  coupon_batch_id?: number;
}
