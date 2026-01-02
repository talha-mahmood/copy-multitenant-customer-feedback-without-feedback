import { DataSource } from 'typeorm';
import { MerchantSetting } from './entities/merchant-setting.entity';

export const merchantSettingProviders = [
  {
    provide: 'MERCHANT_SETTING_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(MerchantSetting),
    inject: ['DATA_SOURCE'],
  },
];
