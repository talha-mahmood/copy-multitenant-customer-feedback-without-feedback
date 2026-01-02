import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, IsUrl } from 'class-validator';

export class CreateMerchantDto {
  // User fields
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  role: string; // 'merchant'

  // Merchant fields
  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  business_name: string;

  @IsNotEmpty()
  @IsString()
  business_type: string;

  @IsNotEmpty()
  @IsString()
  merchant_type: string; // 'temporary' or 'annual'

  @IsOptional()
  @IsString()
  tax_id?: string;

  @IsOptional()
  admin_id?: number; // Required for annual merchants to credit commission

  // Review platform settings
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
}
