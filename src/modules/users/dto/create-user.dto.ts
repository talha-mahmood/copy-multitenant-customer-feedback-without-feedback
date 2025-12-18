import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsBoolean, Matches, IsNumber } from 'class-validator';
import { Exclude } from 'class-transformer';

export class CreateUserDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(11, 11)
  @Matches(/^03\d{9}$/, { message: 'Phone number must start with 03 and be 11 digits long' })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Exclude({ toPlainOnly: true })
  password: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}