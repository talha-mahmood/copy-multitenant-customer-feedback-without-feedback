import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThan, Not } from 'typeorm';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponExpiryCronService {
  constructor(
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
  ) {}

  // Run every day at midnight to check for expired coupons
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // @Cron(CronExpression.EVERY_MINUTE) // Uncomment for testing
  async markExpiredCoupons() {
    console.log('Starting coupon expiry check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all coupons where batch end_date has passed and status is not 'expired'
      const result = await this.couponRepository
        .createQueryBuilder('coupon')
        .innerJoin('coupon.batch', 'batch')
        .where('batch.end_date < :today', { today })
        .andWhere('coupon.status != :expiredStatus', { expiredStatus: 'expired' })
        .update(Coupon)
        .set({ status: 'expired' })
        .execute();

      console.log(`Marked ${result.affected || 0} coupons as expired`);
    } catch (error) {
      console.error('Error marking expired coupons:', error);
    }
  }
}
