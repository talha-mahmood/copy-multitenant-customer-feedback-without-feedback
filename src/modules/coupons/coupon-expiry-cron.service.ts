import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { MerchantWallet } from '../wallets/entities/merchant-wallet.entity';
import { CreditsLedger } from '../wallets/entities/credits-ledger.entity';

@Injectable()
export class CouponExpiryCronService {
  constructor(
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('MERCHANT_WALLET_REPOSITORY')
    private merchantWalletRepository: Repository<MerchantWallet>,
    @Inject('CREDITS_LEDGER_REPOSITORY')
    private creditsLedgerRepository: Repository<CreditsLedger>,
  ) {}

  // Run every day at midnight to check for expired coupons
//   @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron('*/80 * * * * *') // Uncomment for testing every eighty seconds
  async markExpiredCoupons() {
    console.log('Starting coupon expiry check...'); 

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all coupons that need to be expired (status = 'created' and batch end_date passed)
      const expiredCoupons = await this.couponRepository
        .createQueryBuilder('coupon')
        .innerJoin('coupon.batch', 'batch')
        .where('batch.end_date < :today', { today })
        .andWhere('coupon.status = :createdStatus', { createdStatus: 'created' })
        .getMany();

      if (expiredCoupons.length === 0) {
        console.log('No coupons to expire');
        return;
      }

      // Group coupons by merchant_id and count
      const merchantRefunds = expiredCoupons.reduce((acc, coupon) => {
        if (!acc[coupon.merchant_id]) {
          acc[coupon.merchant_id] = 0;
        }
        acc[coupon.merchant_id]++;
        return acc;
      }, {} as Record<number, number>);

      // Update coupon statuses to expired
      const couponIds = expiredCoupons.map(c => c.id);
      await this.couponRepository
        .createQueryBuilder()
        .update(Coupon)
        .set({ status: 'expired' })
        .whereInIds(couponIds)
        .execute();

      console.log(`Marked ${expiredCoupons.length} coupons as expired`);

      // Process refunds for each merchant
      for (const [merchantIdStr, refundCount] of Object.entries(merchantRefunds)) {
        const merchantId = parseInt(merchantIdStr);

        try {
          // Get merchant wallet
          const wallet = await this.merchantWalletRepository.findOne({
            where: { merchant_id: merchantId },
          });

          if (!wallet) {
            console.error(`Merchant wallet not found for merchant ${merchantId}`);
            continue;
          }

          const balanceBefore = wallet.coupon_credits;
          const balanceAfter = balanceBefore + refundCount;

          // Update wallet
          await this.merchantWalletRepository.update(
            { merchant_id: merchantId },
            { coupon_credits: balanceAfter }
          );

          // Create ledger entry
          await this.creditsLedgerRepository.save({
            owner_type: 'merchant',
            owner_id: merchantId,
            credit_type: 'coupon',
            action: 'refund',
            amount: refundCount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            related_object_type: 'coupon',
            description: `Refund for ${refundCount} expired unused coupons`,
            metadata: JSON.stringify({
              refund_type: 'expiry_refund',
              expired_date: today.toISOString(),
              coupon_count: refundCount,
            }),
          });

          console.log(`Refunded ${refundCount} coupon credits to merchant ${merchantId}`);
        } catch (error) {
          console.error(`Error refunding credits for merchant ${merchantId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error marking expired coupons:', error);
    }
  }
}
