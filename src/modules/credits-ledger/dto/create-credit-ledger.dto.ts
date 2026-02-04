import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateCreditLedgerDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['merchant', 'agent', 'master'])
  owner_type: string;

  @IsNotEmpty()
  @IsNumber()
  owner_id: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coupon', 'wa_ui', 'wa_bi'])
  credit_type: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['purchase', 'deduct', 'refund', 'adjustment'])
  action: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  balance_after: number;

  @IsOptional()
  @IsString()
  related_object_type?: string;

  @IsOptional()
  @IsNumber()
  related_object_id?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  transaction_reference?: string;
}
