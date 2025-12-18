import dbConfig from '../data-source';
import { seedUser } from './user/user.seeder';

import { rolesPermissionsSeeder } from './roles-permissions/roles-permissions.seeder';

async function runSeeders() {
  await dbConfig.initialize();

  // Users and Roles
  await rolesPermissionsSeeder(dbConfig);
  await seedUser(dbConfig);


  await dbConfig.destroy();
}

runSeeders();
