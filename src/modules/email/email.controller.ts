import { 
  Controller, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus, 
  UsePipes, 
  ValidationPipe,
  Logger 
} from '@nestjs/common';
import { EmailService } from './email.service';
import { SendConfirmationDto } from './dto/send-confirmation.dto';
import { SendPasswordResetDto } from './dto/send-password-reset.dto';
import { SendResidentCredentialsDto } from './dto/send-resident-credentials.dto';
import { SendPlainEmailDto } from './dto/send-plain-email.dto';
import { SendHtmlEmailDto } from './dto/send-html-email.dto';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post('send-confirmation')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendConfirmation(@Body() body: SendConfirmationDto) {
    try {
      this.logger.log(`Sending confirmation email to ${body.email}`);
      
      const result = await this.emailService.sendUserConfirmation(
        body.email,
        body.name,
        body.token
      );
      
      this.logger.log(`Confirmation email sent successfully to ${body.email}`);
      return {
        success: true,
        message: 'Confirmation email sent successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${body.email}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send confirmation email',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-reset')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendReset(@Body() body: SendPasswordResetDto) {
    try {
      this.logger.log(`Sending password reset email to ${body.email}`);
      
      const result = await this.emailService.sendPasswordReset(
        body.email,
        body.token
      );
      
      this.logger.log(`Password reset email sent successfully to ${body.email}`);
      return {
        success: true,
        message: 'Password reset email sent successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${body.email}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send password reset email',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-resident-credentials')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendResidentCredentials(@Body() body: SendResidentCredentialsDto) {
    try {
      this.logger.log(`Sending resident credentials to ${body.email}`);
      
      const result = await this.emailService.sendResidentCredentials(
        body.email,
        body.name,
        body.username,
        body.password
      );
      
      this.logger.log(`Resident credentials sent successfully to ${body.email}`);
      return {
        success: true,
        message: 'Resident credentials sent successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send resident credentials to ${body.email}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send resident credentials',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-plain-email')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendPlainEmail(@Body() body: SendPlainEmailDto) {
    try {
      this.logger.log(`Sending plain email to ${body.to}`);
      
      const result = await this.emailService.sendPlainEmail(
        body.to,
        body.subject,
        body.text
      );
      
      this.logger.log(`Plain email sent successfully to ${body.to}`);
      return {
        success: true,
        message: 'Plain email sent successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send plain email to ${body.to}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send plain email',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-html-email')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendHtmlEmail(@Body() body: SendHtmlEmailDto) {
    try {
      this.logger.log(`Sending HTML email to ${body.to}`);
      
      const result = await this.emailService.sendHtmlEmail(
        body.to,
        body.subject,
        body.html
      );
      
      this.logger.log(`HTML email sent successfully to ${body.to}`);
      return {
        success: true,
        message: 'HTML email sent successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send HTML email to ${body.to}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send HTML email',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}