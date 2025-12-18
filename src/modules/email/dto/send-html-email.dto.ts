import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class SendHtmlEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  to: string;

  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString({ message: 'HTML content must be a string' })
  @IsNotEmpty({ message: 'HTML content is required' })
  html: string;
}
