import dbConfig from '../data-source';
import { seedUser } from './user/user.seeder';

import { rolesPermissionsSeeder } from './roles-permissions/roles-permissions.seeder';
import { creditPackagesSeeder } from './credit-packages/credit-packages.seeder';

async function runSeeders() {
  await dbConfig.initialize();

  // Users and Roles
  await rolesPermissionsSeeder(dbConfig);
  await seedUser(dbConfig);

  // Credit Packages
  await creditPackagesSeeder(dbConfig);

  await dbConfig.destroy();
}

runSeeders();
