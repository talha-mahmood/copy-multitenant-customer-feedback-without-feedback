import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ShowCouponBatchDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}
