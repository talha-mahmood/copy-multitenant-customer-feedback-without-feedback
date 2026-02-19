import { Injectable, HttpException } from '@nestjs/common';
import Stripe from 'stripe';
import { AdminService } from '../modules/admins/admin.service';

@Injectable()
export class StripeService {
  private platformStripe: Stripe; // Fallback platform Stripe instance

  constructor(private adminService: AdminService) {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY is not set. Platform Stripe will not be available.');
    } else {
      this.platformStripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
      });
    }
  }

  /**
   * Get Stripe instance based on stripe type
   * @param stripeType - 'agent' or 'platform'
   * @param adminId - Required when stripeType is 'agent'
   * @returns Stripe instance
   */
  private async getStripeInstance(stripeType: 'agent' | 'platform', adminId?: number): Promise<Stripe> {
    if (stripeType === 'agent') {
      // Agent Stripe: MUST have adminId and agent must have configured Stripe key
      if (!adminId) {
        throw new HttpException(
          'Admin ID is required for agent Stripe payments.',
          400,
        );
      }

      const agentStripeKey = await this.adminService.getDecryptedStripeKey(adminId);
      
      if (!agentStripeKey) {
        throw new HttpException(
          `Agent ${adminId} has not configured their Stripe API key. Please set up Stripe integration in agent settings before accepting payments.`,
          400,
        );
      }
      
      return new Stripe(agentStripeKey, {
        apiVersion: '2025-12-15.clover',
      });
    }

    // Platform Stripe
    if (!this.platformStripe) {
      throw new HttpException(
        'STRIPE_SECRET_KEY is not set. Stripe cannot be initialized.',
        500,
      );
    }

    return this.platformStripe;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    stripeType: 'agent' | 'platform'; // Explicitly specify which Stripe to use
    adminId?: number; // Required when stripeType is 'agent'
  }) {
    const { amount, currency = 'usd', metadata, stripeType, adminId } = params;

    const stripe = await this.getStripeInstance(stripeType, adminId);

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
    packageId?: number;
    successUrl: string;
    cancelUrl: string;
    stripeType: 'agent' | 'platform'; // Explicitly specify which Stripe to use
    adminId?: number; // Required when stripeType is 'agent'
  }) {
    const {
      amount,
      currency = 'usd',
      packageId,
      successUrl,
      cancelUrl,
      stripeType,
      adminId,
    } = params;

    const stripe = await this.getStripeInstance(stripeType, adminId);

    const session = await stripe.checkout.sessions.create({
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
