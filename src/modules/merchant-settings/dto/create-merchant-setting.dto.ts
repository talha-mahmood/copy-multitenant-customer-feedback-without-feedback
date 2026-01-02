import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMerchantSettingDto {
  @IsNumber()
  merchantId: number;

  @IsOptional()
  @IsBoolean()
  enablePresetReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enableGoogleReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enableFacebookReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enableInstagramReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  enableXiaohongshuReviews?: boolean;

  @IsOptional()
  @IsString()
  googleReviewUrl?: string;

  @IsOptional()
  @IsString()
  facebookPageUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  xiaohongshuUrl?: string;
}
