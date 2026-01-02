import { PartialType } from '@nestjs/mapped-types';
import { CreatePresetReviewDto } from './create-preset-review.dto';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePresetReviewDto extends PartialType(CreatePresetReviewDto) {}

export class UpdatePresetReviewItemDto extends PartialType(CreatePresetReviewDto) {
  @IsNumber()
  id: number;
}

export class BulkUpdatePresetReviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePresetReviewItemDto)
  reviews: UpdatePresetReviewItemDto[];
}
