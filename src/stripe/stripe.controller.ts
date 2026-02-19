import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeContextService } from './stripe-context.service';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { CurrentUser, User } from 'src/common/decorators/current-user';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeContextService: StripeContextService,
  ) { }

  /**
   * Create PaymentIntent (NEW FLOW)
   * Frontend will use clientSecret with Payment Element
   * Automatically determines Stripe routing based on authenticated user
   */
  @SkipSubscription()
  @Post('create-payment-intent')
  async createPaymentIntent(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
    @Body('currency') currency?: string,
    @Body('package_id') packageId?: number,
  ) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Auto-determine Stripe context from user role
    const context = await this.stripeContextService.getStripeContext(user);

    const intent = await this.stripeService.createPaymentIntent({
      amount,
      currency,
      metadata: packageId
        ? { package_id: packageId.toString() }
        : undefined,
      stripeType: context.stripeType,
      adminId: context.adminId,
    });

    return {
      clientSecret: intent.client_secret,
    };
  }

  /**
   * Create Checkout Session (LEGACY FLOW)
   * Frontend will redirect to session.url
   * Automatically determines Stripe routing based on authenticated user
   */
  @SkipSubscription()
  @Post('create-checkout-session')
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('package_id') packageId: number,
  ) {
    // Auto-determine Stripe context from user role
    const context = await this.stripeContextService.getStripeContext(user);

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
      stripeType: context.stripeType,
      adminId: context.adminId,
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }
}
