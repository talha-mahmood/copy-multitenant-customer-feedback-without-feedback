import { Controller, Post, Body, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { AgentStripeSettingsService } from 'src/modules/agent-stripe-settings/agent-stripe-settings.service';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly agentStripeSettingsService: AgentStripeSettingsService,
    @Inject('MERCHANT_REPOSITORY')
    private readonly merchantRepository: Repository<Merchant>,
  ) { }

  /**
   * Helper to resolve agent's secret key from merchant ID
   */
  private async getAgentSecretKeyByMerchant(merchantId: number): Promise<{ secretKey: string; adminId: number }> {
    if (!merchantId) {
      throw new BadRequestException('Merchant ID is required');
    }

    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId }
    });

    if (!merchant || !merchant.admin_id) {
      throw new NotFoundException('Merchant or associated Agent not found');
    }

    const secretKey = await this.agentStripeSettingsService.getDecryptedSecretKey(merchant.admin_id);
    return { secretKey, adminId: merchant.admin_id };
  }

  /**
   * Create PaymentIntent (Dynamic BYOS)
   */
  @SkipSubscription()
  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a PaymentIntent using the agent\'s Stripe account' })
  async createPaymentIntent(
    @Body('amount') amount: number,
    @Body('merchant_id') merchantId: number,
    @Body('package_id') packageId?: number,
    @Body('currency') currency: string = 'usd',
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const { secretKey, adminId } = await this.getAgentSecretKeyByMerchant(merchantId);

    const intent = await this.stripeService.createPaymentIntent({
      amount,
      currency,
      secretKey,
      metadata: {
        agent_id: adminId.toString(),
        merchant_id: merchantId.toString(),
        package_id: packageId ? packageId.toString() : '',
      },
    });

    const settings = await this.agentStripeSettingsService.getStripeSettings(adminId);
    return {
      clientSecret: intent.client_secret,
      publishableKey: settings?.publishableKey,
    };
  }

  /**
   * Create Checkout Session (Dynamic BYOS)
   */
  @SkipSubscription()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Checkout Session using the agent\'s Stripe account' })
  async createCheckoutSession(
    @Body('amount') amount: number,
    @Body('merchant_id') merchantId: number,
    @Body('package_id') packageId?: number,
    @Body('currency') currency: string = 'usd',
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const { secretKey, adminId } = await this.getAgentSecretKeyByMerchant(merchantId);

    const successUrl =
      process.env.FRONTEND_SUCCESS_URL ||
      `${process.env.APP_FRONTEND_URL || 'http://localhost:3000'}/stripe/success`;
    const cancelUrl =
      process.env.FRONTEND_CANCEL_URL ||
      `${process.env.APP_FRONTEND_URL || 'http://localhost:3000'}/stripe/cancel`;

    const session = await this.stripeService.createCheckoutSession({
      amount,
      currency,
      secretKey,
      successUrl,
      cancelUrl,
      metadata: {
        agent_id: adminId.toString(),
        merchant_id: merchantId.toString(),
        package_id: packageId ? packageId.toString() : '',
      },
    });

    const settings = await this.agentStripeSettingsService.getStripeSettings(adminId);
    return {
      sessionId: session.id,
      sessionUrl: session.url,
      publishableKey: settings?.publishableKey,
    };
  }
}
