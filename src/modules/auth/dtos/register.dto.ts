import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { IsUnique } from '../../../common/decorators/is-unique.decorator';
import { User } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString() @IsNotEmpty() readonly name: string;

  @IsUnique(() => User, 'email')
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  readonly password: string;

  @IsString() @IsNotEmpty() @MinLength(8) readonly confirmPassword: string;

  @IsEnum(UserRole, {
    message: 'Role must be either agent, admin, developer, or buyer/seller',
  })
  readonly role: UserRole;

  @IsString() @IsNotEmpty() readonly phone: string;
}
