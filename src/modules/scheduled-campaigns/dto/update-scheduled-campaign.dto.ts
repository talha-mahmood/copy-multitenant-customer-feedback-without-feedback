import { IsOptional, IsString, IsInt, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { TargetAudience, CampaignStatus } from '../entities/scheduled-campaign.entity';

export class UpdateScheduledCampaignDto {
  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsInt()
  coupon_batch_id?: number;

  @IsOptional()
  @IsString()
  campaign_name?: string;

  @IsOptional()
  @IsString()
  campaign_message?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduled_date?: Date;

  @IsOptional()
  @IsEnum(TargetAudience)
  target_audience?: TargetAudience;

  @IsOptional()
  @IsBoolean()
  send_coupons?: boolean;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
