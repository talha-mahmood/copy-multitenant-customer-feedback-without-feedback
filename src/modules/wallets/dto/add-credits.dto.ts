import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class AddCreditsDto {
  @IsNumber()
  @Min(1)
  credits: number;

  @IsString()
  credit_type: string; // e.g., "whatsapp message", "paid ads", "coupon"

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  admin_id: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: any;
}
