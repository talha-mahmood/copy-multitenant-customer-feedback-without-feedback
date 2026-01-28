import { DataSource } from 'typeorm';
import { SuperadminRole } from './entities/superadmin-role.entity';

export const superadminRoleProviders = [
    {
        provide: 'SUPERADMIN_ROLE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(SuperadminRole),
        inject: ['DATA_SOURCE'],
    },
];
