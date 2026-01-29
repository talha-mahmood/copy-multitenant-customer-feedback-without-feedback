import { IsNotEmpty, IsString, IsInt, IsEnum, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetAudience } from '../entities/scheduled-campaign.entity';

export class CreateScheduledCampaignDto {
  @IsNotEmpty()
  @IsInt()
  merchant_id: number;

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
