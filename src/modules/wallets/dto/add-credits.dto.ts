import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class AddCreditsDto {
  @IsNumber()
  @Min(1)
  credits: number;

  @IsString()
  @IsIn(['marketing', 'utility', 'general'])
  credit_type: 'marketing' | 'utility' | 'general';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  admin_id: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: any;
}
