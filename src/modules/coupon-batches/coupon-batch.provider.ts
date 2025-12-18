import { DataSource } from 'typeorm';
import { CouponBatch } from './entities/coupon-batch.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

export const couponBatchProvider = [
  {
    provide: 'COUPON_BATCH_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CouponBatch),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'COUPON_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Coupon),
    inject: ['DATA_SOURCE'],
  },
];
