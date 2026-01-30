import { IsNotEmpty, IsString, IsInt, IsEnum, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { TargetAudience } from '../entities/scheduled-campaign.entity';

export class CreateScheduledCampaignDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsNotEmpty()
  @IsInt()
  merchant_id: number;

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsInt()
  coupon_batch_id?: number;

  @IsNotEmpty()
  @IsString()
  campaign_name: string;

  @IsNotEmpty()
  @IsString()
  campaign_message: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduled_date: Date;

  @IsNotEmpty()
  @IsEnum(TargetAudience)
  target_audience: TargetAudience;

  @IsNotEmpty()
  @IsBoolean()
  send_coupons: boolean;
}
