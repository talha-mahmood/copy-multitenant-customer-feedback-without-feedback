import { IsString, IsInt, IsNumber, IsOptional, IsIn, Min, Max, IsBoolean } from 'class-validator';

export class CreateLuckyDrawPrizeDto {
  @IsInt()
  merchant_id: number;

  @IsInt()
  @IsOptional()
  batch_id?: number;

  @IsString()
  prize_name: string;

  @IsString()
  @IsOptional()
  prize_description?: string;

  @IsString()
  @IsIn(['coupon', 'discount', 'free_item', 'no_prize'])
  prize_type: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  probability: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  daily_limit?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  total_limit?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}
