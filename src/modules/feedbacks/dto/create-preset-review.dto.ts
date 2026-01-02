import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePresetReviewDto {
  @IsOptional()
  @IsNumber()
  merchant_id?: number; // null for system defaults

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

export class BulkCreatePresetReviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePresetReviewDto)
  reviews: CreatePresetReviewDto[];
}
