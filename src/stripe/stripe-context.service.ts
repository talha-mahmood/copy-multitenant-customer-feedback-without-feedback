import { Injectable, Inject, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { User } from '../common/decorators/current-user';

export interface StripeContext {
  stripeType: 'platform' | 'agent';
  adminId?: number;
}

@Injectable()
export class StripeContextService {
  constructor(
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Determines Stripe payment routing based on authenticated user role
   * 
   * Rules:
   * - Agent (role: 'admin') → Platform Stripe (subscription + wallet top-up)
   * - Merchant (role: 'merchant') → Agent's Stripe (their assigned agent)
   * - Super Admin (role: 'super-admin') → Not allowed (throws error)
   * 
   * @param user - Authenticated user from JWT token
   * @returns StripeContext - { stripeType, adminId }
   */
  async getStripeContext(user: User): Promise<StripeContext> {
    // Agent: All payments go to platform
    if (user.role === 'admin') {
      return {
        stripeType: 'platform',
        adminId: undefined,
      };
    }

    // Merchant: Payments go to their assigned agent's Stripe
    if (user.role === 'merchant') {
      if (!user.merchantId) {
        throw new BadRequestException('Merchant ID not found in token');
      }

      const merchant = await this.merchantRepository.findOne({
        where: { id: user.merchantId },
        select: ['id', 'admin_id'],
      });

      if (!merchant) {
        throw new BadRequestException('Merchant not found');
      }

      if (!merchant.admin_id) {
        throw new BadRequestException('No assigned agent found for this merchant. Please contact support.');
      }

      return {
        stripeType: 'agent',
        adminId: merchant.admin_id,
      };
    }

    // Super Admin: Payments not allowed
    if (user.role === 'super-admin') {
      throw new ForbiddenException('Super admin cannot make payments');
    }

    // Invalid role
    throw new UnauthorizedException('Invalid user role for payment processing');
  }
}
