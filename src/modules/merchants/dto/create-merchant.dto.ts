import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, IsUrl, IsNumber } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Admin } from 'src/modules/admins/entities/admin.entity';

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
  name: string;

  @IsNotEmpty()
  @IsString()
  role: string; // 'merchant'

  // Merchant fields
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  map_link?: string;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

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

  @Exists(() => Admin, 'id', { message: 'Admin must exist' })
  @IsOptional()
  admin_id?: number; // Required for annual merchants to credit commission

  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
