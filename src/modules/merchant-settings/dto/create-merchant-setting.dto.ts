import { IsBoolean, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

export class CreateMerchantSettingDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsNumber()
  merchant_id: number;

  @IsOptional()
  @IsBoolean()
  enable_preset_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_google_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_facebook_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_instagram_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_xiaohongshu_reviews?: boolean;

  @IsOptional()
  @IsString()
  google_review_url?: string;

  @IsOptional()
  @IsString()
  facebook_page_url?: string;

  @IsOptional()
  @IsString()
  instagram_url?: string;

  @IsOptional()
  @IsString()
  xiaohongshu_url?: string;

  @IsOptional()
  @IsBoolean()
  paid_ads?: boolean;

  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsBoolean()
  luckydraw_enabled?: boolean;

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsInt()
  whatsapp_enabled_for_batch_id?: number;

  @IsOptional()
  @IsBoolean()
  birthday_message_enabled?: boolean;

  @IsOptional()
  @IsInt()
  days_before_birthday?: number;

  @IsOptional()
  @IsInt()
  days_after_birthday?: number;

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsInt()
  birthday_coupon_batch_id?: number;
}
