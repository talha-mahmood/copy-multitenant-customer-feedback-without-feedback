import { IsNumber } from 'class-validator';

export class ShowRoleDto {
  @IsNumber()
  id: number;
}
