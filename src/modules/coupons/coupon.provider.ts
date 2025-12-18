import { DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';

export const couponProvider = [
  {
    provide: 'COUPON_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Coupon),
    inject: ['DATA_SOURCE'],
  },
];
