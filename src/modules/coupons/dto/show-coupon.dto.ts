import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ShowCouponDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}
