import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMerchantDto {
  // User fields
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  role: string; // 'merchant'

  // Merchant fields
  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  business_name: string;

  @IsNotEmpty()
  @IsString()
  business_type: string;

  @IsNotEmpty()
  @IsString()
  merchant_type: string; // 'temporary' or 'annual'

  @IsOptional()
  @IsString()
  tax_id?: string;
}
