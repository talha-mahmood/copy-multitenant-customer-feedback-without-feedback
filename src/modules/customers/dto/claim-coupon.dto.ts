import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class ClaimCouponDto {
  @IsInt()
  @IsNotEmpty()
  merchant_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  date_of_birth?: string; // Format: DD-MM-YYYY
}
