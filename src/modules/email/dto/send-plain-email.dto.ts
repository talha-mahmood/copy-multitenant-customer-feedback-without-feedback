import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class SendPlainEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  to: string;

  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString({ message: 'Text content must be a string' })
  @IsNotEmpty({ message: 'Text content is required' })
  text: string;
}
