import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreatePresetReviewDto {
  @IsOptional()
  @IsNumber()
  merchantId?: number; // null for system defaults

  @IsNotEmpty()
  @IsString()
  reviewText: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
