import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private mailerService: MailerService,
    private readonly configService: ConfigService
  ) { }

  /**
   * Check if template exists and log helpful information
   */
  private checkTemplateExists(templateName: string): boolean {
    const templatePath = path.join(process.cwd(), 'dist', 'modules', 'email', 'templates', `${templateName}.hbs`);
    const sourcePath = path.join(process.cwd(), 'src', 'modules', 'email', 'templates', `${templateName}.hbs`);
    
    const distExists = fs.existsSync(templatePath);
    const srcExists = fs.existsSync(sourcePath);
    
    this.logger.debug(`Template check for ${templateName}:`);
    this.logger.debug(`  Dist path: ${templatePath} - ${distExists ? 'EXISTS' : 'NOT FOUND'}`);
    this.logger.debug(`  Src path: ${sourcePath} - ${srcExists ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (!distExists && srcExists) {
      this.logger.warn(`Template ${templateName} exists in src but not in dist. Please rebuild the application.`);
    }
    
    return distExists;
  }

  async sendUserConfirmation(email: string, name: string, token: string) {
    try {
      this.checkTemplateExists('confirmation');
      
      const url = `${this.configService.get('APP_URL')}/auth/confirm?token=${token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to MEsate! Please confirm your Email',
        template: './confirmation',
        context: {
          name,
          url,
        },
      });

      this.logger.log(`Confirmation email sent to ${email}`);
      return { success: true, message: 'Confirmation email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${email}:`, error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
  }

  async sendPasswordReset(email: string, token: string) {
    try {
      this.checkTemplateExists('password-reset');
      
      const url = `${this.configService.get('APP_URL')}/auth/reset-password?token=${token}`;

      const response = await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: './password-reset',
        context: {
          url,
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return {
        message: 'Password reset email sent successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendResidentCredentials(email: string, name: string, username: string, password: string) {
    try {
      this.checkTemplateExists('resident-credentials');
      
      const loginUrl = `${this.configService.get('APP_FRONTEND_URL')}/login`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to MEsate - Your Account Credentials',
        template: './resident-credentials',
        context: {
          name,
          username,
          password,
          loginUrl,
          appName: 'MEsate',
        },
      });

      this.logger.log(`Resident credentials sent to ${email}`);
      return { success: true, message: 'Resident credentials sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send resident credentials to ${email}:`, error);
      
      // Fallback: send a simple HTML email if template fails
      try {
        this.logger.log(`Attempting fallback email for ${email}`);
        await this.sendHtmlEmail(
          email,
          'Welcome to MEsate - Your Account Credentials',
          `
          <h2>Welcome to MEsate, ${name}!</h2>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Login URL:</strong> <a href="${this.configService.get('APP_FRONTEND_URL')}/auth/login">Click here to login</a></p>
          <p><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
          <p>Best regards,<br>MEsate Management Team</p>
          `
        );
        this.logger.log(`Fallback email sent successfully to ${email}`);
        return { success: true, message: 'Resident credentials sent via fallback method' };
      } catch (fallbackError) {
        this.logger.error(`Fallback email also failed for ${email}:`, fallbackError);
        throw new Error(`Failed to send resident credentials: ${error.message}`);
      }
    }
  }

  async sendPlainEmail(to: string, subject: string, text: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text,
      });

      this.logger.log(`Plain email sent to ${to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send plain email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendHtmlEmail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });

      this.logger.log(`HTML email sent to ${to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send HTML email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}