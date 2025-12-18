import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { NodeEnvironment } from '../enums/node-environment';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  APP_NAME: string;

  @IsEnum(NodeEnvironment)
  @IsNotEmpty()
  APP_ENV: NodeEnvironment;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  APP_URL: string;

  @IsString()
  @IsOptional()
  APP_KEY: string;

  @IsBoolean()
  @IsOptional()
  APP_DEBUG: boolean;

  @IsString()
  @IsOptional()
  APP_TIMEZONE: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  APP_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_CONNECTION: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  MAIL_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MAIL_PORT: number;

  @IsString()
  @IsNotEmpty()
  MAIL_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM_ADDRESS: string;

  @IsString()
  @IsOptional()
  MAIL_FROM_NAME: string;

  @IsBoolean()
  @IsOptional()
  MAIL_SECURE: boolean;

  @IsString()
  @IsNotEmpty()
  ENCRYPTION_KEY: string;

  @IsString()
  @IsNotEmpty()
  ENCRYPTION_SALT: string;

  // WhatsApp Business API Configuration
  @IsUrl({ require_tld: false })
  @IsOptional()
  WHATSAPP_API_URL: string;

  @IsString()
  @IsOptional()
  WHATSAPP_TOKEN: string;

  @IsString()
  @IsOptional()
  WHATSAPP_PHONE_NUMBER_ID: string;

  @IsString()
  @IsOptional()
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
