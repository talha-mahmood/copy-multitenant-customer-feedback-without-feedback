import { IsOptional, IsString, IsInt, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetAudience, CampaignStatus } from '../entities/scheduled-campaign.entity';

export class UpdateScheduledCampaignDto {
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
