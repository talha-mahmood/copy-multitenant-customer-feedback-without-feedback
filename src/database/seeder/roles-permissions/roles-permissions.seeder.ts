import { DataSource } from 'typeorm';
import { Role } from '../../../modules/roles-permission-management/roles/entities/role.entity';

import roles from './roles.json';

export async function rolesPermissionsSeeder(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  // Insert roles only if they don't exist
  for (const role of roles) {
    const existingRole = await roleRepository.findOne({
      where: { name: role.name },
    });

    if (!existingRole) {
      await roleRepository.save(roleRepository.create(role));
    }
  }

  console.info('Saving Roles');
}
