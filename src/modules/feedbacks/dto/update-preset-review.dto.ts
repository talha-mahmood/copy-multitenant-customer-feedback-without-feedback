import { PartialType } from '@nestjs/mapped-types';
import { CreatePresetReviewDto } from './create-preset-review.dto';

export class UpdatePresetReviewDto extends PartialType(CreatePresetReviewDto) {}
