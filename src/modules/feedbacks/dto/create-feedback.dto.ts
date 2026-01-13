import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsIn, IsBoolean } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { PresetReview } from 'src/modules/feedbacks/entities/preset-review.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

export class CreateFeedbackDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsNotEmpty()
  @IsNumber()
  merchantId: number;

  // Customer fields
  @IsNotEmpty()
  @IsEmail()
  email: string;

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

  @Exists(() => PresetReview, 'id', { message: 'Preset Review must exist' })
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

  @Exists(() => CouponBatch, 'id', { message: 'Coupon Batch must exist' })
  @IsOptional()
  @IsNumber()
  coupon_batch_id?: number;
}
