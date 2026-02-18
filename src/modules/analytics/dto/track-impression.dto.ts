import { IsInt, IsPositive } from 'class-validator';

export class TrackImpressionDto {
  @IsInt()
  @IsPositive()
  merchantId: number;

  @IsInt()
  @IsPositive()
  agentId: number;

  @IsInt()
  @IsPositive()
  paidAdId: number;
}
