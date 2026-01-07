import { IsBoolean, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMerchantSettingDto {
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
}
