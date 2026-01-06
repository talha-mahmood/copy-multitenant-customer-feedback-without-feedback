import { IsInt } from 'class-validator';

export class SpinWheelDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  merchant_id: number;

  @IsInt()
  batch_id: number;
}
