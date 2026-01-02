import { IsArray, IsNumber } from 'class-validator';

export class BulkDeletePresetReviewDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
