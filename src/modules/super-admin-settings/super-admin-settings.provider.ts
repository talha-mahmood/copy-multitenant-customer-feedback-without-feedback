import { DataSource } from 'typeorm';
import { SuperAdminSettings } from './entities/super-admin-settings.entity';

export const SUPER_ADMIN_SETTINGS_REPOSITORY = 'SUPER_ADMIN_SETTINGS_REPOSITORY';

export const superAdminSettingsProviders = [
  {
    provide: SUPER_ADMIN_SETTINGS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SuperAdminSettings),
    inject: ['DATA_SOURCE'],
  },
];
