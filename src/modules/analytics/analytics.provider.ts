import { DataSource } from 'typeorm';
import { MerchantAnalytics } from './entities/merchant-analytics.entity';

export const analyticsProviders = [
  {
    provide: 'MERCHANT_ANALYTICS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(MerchantAnalytics),
    inject: ['DATA_SOURCE'],
  },
];
