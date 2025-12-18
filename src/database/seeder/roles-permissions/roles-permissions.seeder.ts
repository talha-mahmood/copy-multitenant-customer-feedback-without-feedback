import { DataSource } from 'typeorm';
import { Role } from '../../../modules/roles-permission-management/roles/entities/role.entity';

import roles from './roles.json';

export async function rolesPermissionsSeeder(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  await roleRepository.upsert(roles, ['name']);

  console.info('Saving Roles');
}
