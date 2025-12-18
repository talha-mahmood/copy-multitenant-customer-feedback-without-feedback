import { DataSource } from 'typeorm';
import { CouponBatch } from './entities/coupon-batch.entity';

export const couponBatchProvider = [
  {
    provide: 'COUPON_BATCH_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CouponBatch),
    inject: ['DATA_SOURCE'],
  },
];
