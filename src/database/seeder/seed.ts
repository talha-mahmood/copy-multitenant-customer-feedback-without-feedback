import dbConfig from '../data-source';
import { seedUser } from './user/user.seeder';

import { rolesPermissionsSeeder } from './roles-permissions/roles-permissions.seeder';
import { creditPackagesSeeder } from './credit-packages/credit-packages.seeder';
import seedCouponTemplates from './seed-coupon-templates';
import { seedPresetReviews } from './seed-preset-reviews';
import { seedMerchantSettings } from './seed-merchant-settings';

async function runSeeders() {
  await dbConfig.initialize();

  // Users and Roles
  await rolesPermissionsSeeder(dbConfig);
  await seedUser(dbConfig);

  // Credit Packages
  await creditPackagesSeeder(dbConfig);
  await seedCouponTemplates(dbConfig);
  
  // Preset Reviews
  await seedPresetReviews(dbConfig);

  // Merchant Settings (for existing merchants)
  await seedMerchantSettings(dbConfig);

  await dbConfig.destroy();
}

runSeeders();
