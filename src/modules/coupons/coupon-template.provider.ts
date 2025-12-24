import { DataSource } from 'typeorm';
import { CouponTemplate } from './entities/coupon-template.entity';

export const couponTemplateProvider = [
  {
    provide: 'COUPON_TEMPLATE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CouponTemplate),
    inject: ['DATA_SOURCE'],
  },
];
