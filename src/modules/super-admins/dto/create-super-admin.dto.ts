import { IsString, IsOptional, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { IsUnique } from 'src/common/decorators/is-unique.decorator';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateSuperAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  @IsUnique(() => User, 'email', { message: 'Email already exists' })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;
}
