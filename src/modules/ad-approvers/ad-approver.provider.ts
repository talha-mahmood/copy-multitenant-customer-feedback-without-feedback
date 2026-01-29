import { DataSource } from 'typeorm';
import { AdApprover } from './entities/ad-approver.entity';

export const adApproverProviders = [
  {
    provide: 'AD_APPROVER_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(AdApprover),
    inject: ['DATA_SOURCE'],
  },
];
