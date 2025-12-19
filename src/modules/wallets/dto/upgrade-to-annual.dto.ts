import { IsNumber, Min } from 'class-validator';

export class UpgradeToAnnualDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  admin_id: number;
}
