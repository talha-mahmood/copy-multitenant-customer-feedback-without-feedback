import { IsNotEmpty, IsNumberString } from 'class-validator';

export class ShowMerchantDto {
  @IsNotEmpty()
  @IsNumberString()
  id: number;
}
