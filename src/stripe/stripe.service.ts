import { Injectable, HttpException, Inject, forwardRef } from '@nestjs/common';
import Stripe from 'stripe';
import { AdminService } from '../modules/admins/admin.service';

@Injectable()
export class StripeService {
  private platformStripe: Stripe; // Fallback platform Stripe instance

  constructor(
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
  ) {
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
   * Validate Stripe API key by making a test API call
   * @param stripeKey - The Stripe secret key to validate
   * @returns true if valid, throws error if invalid
   */
  async validateStripeKey(stripeKey: string): Promise<boolean> {
    if (!stripeKey || !stripeKey.trim()) {
      throw new HttpException('Stripe key cannot be empty', 400);
    }

    // Check format
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      throw new HttpException(
        'Invalid Stripe key format. Key must start with sk_test_ or sk_live_',
        400,
      );
    }

    try {
      // Create a temporary Stripe instance with the provided key
      const testStripe = new Stripe(stripeKey, {
        apiVersion: '2025-12-15.clover',
      });

      // Make a simple API call to verify the key works
      // Using balance.retrieve() is lightweight and available for all Stripe accounts
      await testStripe.balance.retrieve();

      return true;
    } catch (error) {
      // Stripe will throw specific errors for invalid keys
      if (error.type === 'StripeAuthenticationError') {
        throw new HttpException(
          'Invalid Stripe API key. Please check your key and try again.',
          400,
        );
      }

      if (error.type === 'StripePermissionError') {
        throw new HttpException(
          'Stripe API key does not have sufficient permissions.',
          400,
        );
      }

      // Generic Stripe error
      throw new HttpException(
        `Stripe validation failed: ${error.message || 'Unknown error'}`,
        400,
      );
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
