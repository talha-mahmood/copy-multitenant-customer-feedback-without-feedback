import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor() { }

  /**
   * Creates a dynamic Stripe client using the provided secret key.
   */
  private getStripeClient(secretKey: string): Stripe {
    if (!secretKey) {
      throw new BadRequestException('Agent Stripe Secret Key is not configured');
    }
    return new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    secretKey: string;
  }) {
    const { amount, currency = 'usd', metadata, secretKey } = params;
    const stripe = this.getStripeClient(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return paymentIntent;
  }

  async createCheckoutSession(params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
    secretKey: string;
  }) {
    const {
      amount,
      currency = 'usd',
      metadata,
      successUrl,
      cancelUrl,
      secretKey,
    } = params;
    const stripe = this.getStripeClient(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: 'Order Payment',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return session;
  }

  /**
   * Validates a Stripe Secret Key by attempting to retrieve account info.
   */
  async validateSecretKey(secretKey: string): Promise<boolean> {
    try {
      const stripe = this.getStripeClient(secretKey);
      await stripe.accounts.retrieve();
      return true;
    } catch (error) {
      return false;
    }
  }
}
