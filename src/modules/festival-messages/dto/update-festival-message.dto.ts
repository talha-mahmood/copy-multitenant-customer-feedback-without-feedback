import { PartialType } from '@nestjs/mapped-types';
import { CreateFestivalMessageDto } from './create-festival-message.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

export class UpdateFestivalMessageDto extends PartialType(CreateFestivalMessageDto) {
  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsOptional()
  @IsInt()
  merchant_id?: number;
}
