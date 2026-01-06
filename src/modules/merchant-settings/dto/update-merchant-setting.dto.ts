import { PartialType } from '@nestjs/mapped-types';
import { CreateMerchantSettingDto } from './create-merchant-setting.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateMerchantSettingDto extends PartialType(CreateMerchantSettingDto) {
  @IsOptional()
  @IsNumber()
  merchant_id?: number;
}
