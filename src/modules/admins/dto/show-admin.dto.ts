import { IsNotEmpty, IsNumberString } from 'class-validator';

export class ShowAdminDto {
  @IsNotEmpty()
  @IsNumberString()
  id: number;
}
