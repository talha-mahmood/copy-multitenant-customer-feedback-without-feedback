import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Stripe cannot be initialized.',
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) {
    const { amount, currency = 'usd', metadata } = params;

    const paymentIntent = await this.stripe.paymentIntents.create({
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
    packageId?: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    const {
      amount,
      currency = 'usd',
      packageId,
      successUrl,
      cancelUrl,
    } = params;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: 'Package payment',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: packageId ? { package_id: packageId.toString() } : undefined,
    });

    return session;
  }
}
