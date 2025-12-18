import { DataSource } from 'typeorm';
import { UserHasRole } from './entities/user-has-role.entity';

export const UserHasRoleProvider = [
  {
    provide: 'USER_HAS_ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(UserHasRole),
    inject: ['DATA_SOURCE'],
  },
];