import { IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';

import { Match } from '../../../common/validators/match.validator'

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  new_password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Validate(Match, ['new_password'], { message: 'Passwords do not match' })
  confirm_password: string;
}