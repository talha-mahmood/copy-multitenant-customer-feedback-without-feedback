import { DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';

export const merchantProviders = [
  {
    provide: 'MERCHANT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Merchant),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_HAS_ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(UserHasRole),
    inject: ['DATA_SOURCE'],
  },
];
