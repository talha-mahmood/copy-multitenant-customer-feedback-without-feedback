import { PartialType } from '@nestjs/mapped-types';
import { CreateSuperAdminDto } from './create-super-admin.dto';
import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

export class UpdateSuperAdminDto extends PartialType(CreateSuperAdminDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
