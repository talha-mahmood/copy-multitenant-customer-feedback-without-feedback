import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  /**
   * Create PaymentIntent (NEW FLOW)
   * Frontend will use clientSecret with Payment Element
   */
  @SkipSubscription()
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body('amount') amount: number,
    @Body('currency') currency?: string,
    @Body('package_id') packageId?: number,
  ) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const intent = await this.stripeService.createPaymentIntent({
      amount,
      currency,
      metadata: packageId
        ? { package_id: packageId.toString() }
        : undefined,
    });

    return {
      clientSecret: intent.client_secret,
    };
  }

  /**
   * Create Checkout Session (LEGACY FLOW)
   * Frontend will redirect to session.url
   */
  @SkipSubscription()
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('package_id') packageId: number,
  ) {
    // You can change these URLs or move them to env variables
    const successUrl =
      process.env.FRONTEND_SUCCESS_URL ||
      `${process.env.APP_FRONTEND_URL || 'http://localhost:3000'}/stripe/success`;
    const cancelUrl =
      process.env.FRONTEND_CANCEL_URL ||
      `${process.env.APP_FRONTEND_URL || 'http://localhost:3000'}/stripe/cancel`;

    const session = await this.stripeService.createCheckoutSession({
      amount,
      currency,
      packageId,
      successUrl,
      cancelUrl,
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }
}
