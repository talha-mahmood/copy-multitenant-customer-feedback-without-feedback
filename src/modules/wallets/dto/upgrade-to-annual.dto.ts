import { IsNumber } from 'class-validator';

export class UpgradeToAnnualDto {
  @IsNumber()
  admin_id: number;
}
