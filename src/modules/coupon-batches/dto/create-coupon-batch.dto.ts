import { IsString, IsInt, IsDate, IsBoolean, IsIn, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponBatchDto {
  @IsInt()
  merchantId: number;

  @IsString()
  batchName: string;

  @IsString()
  @IsIn(['annual', 'temporary'])
  batchType: string;

  @IsInt()
  @Min(1)
  totalQuantity: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  couponTemplateId?: number;

  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  luckyDrawEnabled?: boolean;
}
