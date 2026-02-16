import { IsNumber, IsOptional, Min } from 'class-validator';

export class InitialSubscriptionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  walletBalance?: number;

  @IsOptional()
  metadata?: any;
}
