import { DataSource } from 'typeorm';
import { SupportStaff } from './entities/support-staff.entity';

export const supportStaffProviders = [
  {
    provide: 'SUPPORT_STAFF_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SupportStaff),
    inject: ['DATA_SOURCE'],
  },
];
