import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStripeSettingsDto {
    @ApiProperty({ description: 'Stripe Publishable Key' })
    @IsNotEmpty()
    @IsString()
    stripePublishableKey: string;

    @ApiProperty({ description: 'Stripe Secret Key' })
    @IsNotEmpty()
    @IsString()
    stripeSecretKey: string;

    @ApiProperty({ description: 'Stripe Webhook Secret', required: false })
    @IsOptional()
    @IsString()
    stripeWebhookSecret?: string;
}
