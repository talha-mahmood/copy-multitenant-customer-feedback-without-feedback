import { IsNotEmpty, IsNumberString } from 'class-validator';

export class ShowCustomerDto {
  @IsNotEmpty()
  @IsNumberString()
  id: number;
}
