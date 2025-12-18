import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCouponDto {
  @IsInt()
  batchId: number;

  @IsInt()
  merchantId: number;

  @IsInt()
  @IsOptional()
  customerId?: number;

  @IsString()
  couponCode: string;

  @IsString()
  @IsOptional()
  qrHash?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
