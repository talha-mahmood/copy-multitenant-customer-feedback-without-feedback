import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository, LessThan, DataSource } from 'typeorm';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { MerchantWallet } from '../wallets/entities/merchant-wallet.entity';
import { CreditLedgerService } from '../credits-ledger/credit-ledger.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';

@Injectable()
export class CouponExpiryCronService {
  constructor(
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('MERCHANT_WALLET_REPOSITORY')
    private merchantWalletRepository: Repository<MerchantWallet>,
    private creditLedgerService: CreditLedgerService,
    private systemLogService: SystemLogService,
  ) {}

  // Run every day at 2:00 AM to check for expired batches
  @Cron('0 2 * * *')
  async processExpiredBatches() {
    console.log('Starting expired batch processing...');

    try {
      const now = new Date();

      // Find batches that have expired (end_date < now) and are still active
      const expiredBatches = await this.couponBatchRepository.find({
        where: {
          end_date: LessThan(now),
          is_active: true,
        },
        relations: ['merchant'],
      });

      console.log(`Found ${expiredBatches.length} expired batches to process`);

      for (const batch of expiredBatches) {
        await this.processExpiredBatch(batch);
      }

      console.log('Expired batch processing completed');
    } catch (error) {
      console.error('Error processing expired batches:', error);
    }
  }

  private async processExpiredBatch(batch: CouponBatch) {
    try {
      // Get all coupons from this batch that were NOT taken (status = 'created')
      const untakenCoupons = await this.couponRepository.count({
        where: {
          batch_id: batch.id,
          status: 'created', // Only coupons that were never claimed
        },
      });

      if (untakenCoupons === 0) {
        // No refund needed, just mark batch as inactive
        await this.couponBatchRepository.update(batch.id, {
          is_active: false,
        });

        // Mark all coupons in batch as expired (if any exist with 'created' status)
        const createdCouponsCount = await this.couponRepository.count({
          where: { batch_id: batch.id, status: 'created' },
        });

        if (createdCouponsCount > 0) {
          await this.couponRepository.update(
            { batch_id: batch.id, status: 'created' },
            { status: 'expired' },
          );
        }

        console.log(`Batch ${batch.id}: No untaken coupons, marked as inactive`);
        return;
      }

      // Get merchant wallet
      const wallet = await this.merchantWalletRepository.findOne({
        where: { merchant_id: batch.merchant_id },
      });

      if (!wallet) {
        console.error(`Wallet not found for merchant ${batch.merchant_id}`);
        return;
      }

      // Refund untaken coupon credits
      const newCouponCredits = wallet.coupon_credits + untakenCoupons;

      await this.merchantWalletRepository.update(wallet.id, {
        coupon_credits: newCouponCredits,
      });

      // Create ledger entry for refund
      await this.creditLedgerService.create({
        owner_type: 'merchant',
        owner_id: batch.merchant_id,
        credit_type: 'coupon',
        action: 'refund',
        amount: untakenCoupons,
        balance_after: newCouponCredits,
        related_object_type: 'coupon_batch',
        related_object_id: batch.id,
        description: `Refunded ${untakenCoupons} coupon credits from expired batch "${batch.batch_name}"`,
        metadata: {
          batch_id: batch.id,
          batch_name: batch.batch_name,
          total_coupons: batch.total_quantity,
          untaken_coupons: untakenCoupons,
          refunded_credits: untakenCoupons,
        },
      });

      // Mark batch as inactive
      await this.couponBatchRepository.update(batch.id, {
        is_active: false,
      });

      // Mark all untaken coupons as expired
      await this.couponRepository.update(
        { batch_id: batch.id, status: 'created' },
        { status: 'expired' },
      );

      // Log the refund
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_REFUND,
        `Refunded ${untakenCoupons} coupon credits from expired batch "${batch.batch_name}"`,
        batch.merchant_id,
        'merchant',
        0,
        {
          batch_id: batch.id,
          batch_name: batch.batch_name,
          total_coupons: batch.total_quantity,
          untaken_coupons: untakenCoupons,
          refunded_credits: untakenCoupons,
        },
      );

      console.log(
        `Batch ${batch.id}: Refunded ${untakenCoupons} credits to merchant ${batch.merchant_id}`,
      );
    } catch (error) {
      console.error(`Error processing batch ${batch.id}:`, error);
    }
  }
}
