import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsIn, IsBoolean } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsNumber()
  merchantId: number;

  // User fields for customer creation
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  // Customer-specific fields
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  // Feedback fields
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  // Review fields
  @IsNotEmpty()
  @IsString()
  @IsIn(['preset', 'custom'])
  reviewType: string; // 'preset' or 'custom'

  @IsOptional()
  @IsNumber()
  presetReviewId?: number; // Required if reviewType is 'preset'

  @IsOptional()
  @IsString()
  customReviewText?: string; // Required if reviewType is 'custom'

  @IsNotEmpty()
  @IsString()
  @IsIn(['google', 'facebook', 'instagram', 'xiaohongshu'])
  selectedPlatform: string;

  @IsOptional()
  @IsBoolean()
  redirectCompleted?: boolean;

  @IsOptional()
  @IsNumber()
  coupon_batch_id?: number;
}
