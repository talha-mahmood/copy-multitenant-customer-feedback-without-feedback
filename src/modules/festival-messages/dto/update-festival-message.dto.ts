import { PartialType } from '@nestjs/mapped-types';
import { CreateFestivalMessageDto } from './create-festival-message.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateFestivalMessageDto extends PartialType(CreateFestivalMessageDto) {
  @IsOptional()
  @IsInt()
  merchant_id?: number;
}
