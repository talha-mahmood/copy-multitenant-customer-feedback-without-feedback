import { validate } from '../helpers/env-validate.helper'

export const envConfig = {
    isGlobal: true,
    envFilePath: ".env",
    validate,
    load: [
        () => ({
            APP_NAME: process.env.APP_NAME,
            APP_ENV: process.env.APP_ENV || 'development',
            APP_URL: process.env.APP_URL || 'http://localhost:3000',
            APP_KEY: process.env.APP_KEY || '',
            APP_DEBUG: process.env.APP_DEBUG === 'true',
            APP_TIMEZONE: process.env.APP_TIMEZONE || 'UTC',
            APP_PORT: parseInt(process.env.APP_PORT || '3000', 10),
            DB_CONNECTION: process.env.DB_CONNECTION || 'postgres',
            DB_HOST: process.env.DB_HOST || '127.0.0.1',
            DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
            DB_NAME: process.env.DB_NAME || '',
            DB_USERNAME: process.env.DB_USERNAME || '',
            DB_PASSWORD: process.env.DB_PASSWORD || '',
            MAIL_HOST: process.env.MAIL_HOST || '',
            MAIL_PORT: parseInt(process.env.MAIL_PORT || '0', 10),
            MAIL_USERNAME: process.env.MAIL_USERNAME || '',
            MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
            MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || '',
            MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'M-Estate',
            MAIL_SECURE: process.env.MAIL_SECURE === 'true',
            ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
            ENCRYPTION_SALT: process.env.ENCRYPTION_SALT,
            // WhatsApp Business API Configuration
            WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v22.0',
            WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || '',
            WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
        }),
    ],
}
