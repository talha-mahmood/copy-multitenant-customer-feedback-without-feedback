import { IsString, IsInt, IsDate, IsBoolean, IsIn, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponBatchDto {
  @IsInt()
  merchant_id: number;

  @IsString()
  batch_name: string;

  @IsString()
  @IsIn(['annual', 'temporary'])
  batch_type: string;

  @IsInt()
  @Min(1)
  total_quantity: number;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  coupon_template_id?: number;

  @IsBoolean()
  @IsOptional()
  whatsapp_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  lucky_draw_enabled?: boolean;
}
