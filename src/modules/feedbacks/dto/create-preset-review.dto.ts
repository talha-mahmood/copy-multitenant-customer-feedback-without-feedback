import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

export class CreatePresetReviewDto {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsOptional()
  @IsNumber()
  merchant_id?: number; // null for system defaults

  @IsNotEmpty()
  @IsString()
  reviewText: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class BulkCreatePresetReviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePresetReviewDto)
  reviews: CreatePresetReviewDto[];
}
