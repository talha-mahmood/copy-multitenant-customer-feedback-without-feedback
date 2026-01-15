import { DataSource } from 'typeorm';
import { SuperAdmin } from './entities/super-admin.entity';

export const SUPER_ADMIN_REPOSITORY = 'SUPER_ADMIN_REPOSITORY';

export const superAdminProviders = [
  {
    provide: SUPER_ADMIN_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SuperAdmin),
    inject: ['DATA_SOURCE'],
  },
];
