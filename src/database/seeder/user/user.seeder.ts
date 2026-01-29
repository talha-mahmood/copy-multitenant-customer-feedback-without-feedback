import { DataSource } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { Admin } from '../../../modules/admins/entities/admin.entity';
import { SuperAdmin } from '../../../modules/super-admins/entities/super-admin.entity';
import { Merchant } from '../../../modules/merchants/entities/merchant.entity';
import { Customer } from '../../../modules/customers/entities/customer.entity';
import { AdminWallet } from '../../../modules/wallets/entities/admin-wallet.entity';
import { MerchantWallet } from '../../../modules/wallets/entities/merchant-wallet.entity';
import { SuperAdminWallet } from '../../../modules/wallets/entities/super-admin-wallet.entity';
import { SuperAdminSettings } from '../../../modules/super-admin-settings/entities/super-admin-settings.entity';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { UserHasRole } from '../../../modules/roles-permission-management/user-has-role/entities/user-has-role.entity';

export async function seedUser(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const userHasRoleRepo = dataSource.getRepository(UserHasRole);

  const hashedPassword = await bcrypt.hash('Pakistan@123', 10);

  if ((await userRepo.createQueryBuilder('users').getCount()) === 0) {
    const users = Array.from({ length: 5 }).map(() => ({
      name: faker.person.fullName(),
      email: `${faker.internet.exampleEmail().split('@')[0]}@must.services`,
      password: hashedPassword,
      role: 'customer',
      phone: '03' + faker.string.numeric(9),
    }));

    users.push({
      name: 'Super Administrator',
      email: 'superadmin@must.services',
      password: hashedPassword,
      role: 'super_admin',
      phone: '03001234566',
    });

    users.push({
      name: 'Administrator',
      email: 'admin@must.services',
      password: hashedPassword,
      role: 'admin',
      phone: '03001234567',
    });

    users.push({
      name: 'Customer User',
      email: 'customer@must.services',
      password: hashedPassword,
      role: 'customer',
      phone: '03001234569',
    });

    users.push({
      name: 'Finance Viewer',
      email: 'finance.viewer@must.services',
      password: hashedPassword,
      role: 'finance_viewer',
      phone: '03001234570',
    });

    users.push({
      name: 'Ad Approver',
      email: 'ad.approver@must.services',
      password: hashedPassword,
      role: 'ad_approver',
      phone: '03001234571',
    });

    users.push({
      name: 'Support Staff',
      email: 'support.staff@must.services',
      password: hashedPassword,
      role: 'support_staff',
      phone: '03001234572',
    });

    // Insert users only if they don't exist
    for (const user of users) {
      const existingUser = await userRepo.findOne({
        where: { email: user.email },
      });

      if (!existingUser) {
        await userRepo.save(userRepo.create(user));
      }
    }

    // Create super admin
    const superAdmin = await userRepo.findOne({
      where: { email: 'superadmin@must.services' },
    });

    if (superAdmin) {
      await userHasRoleRepo.insert({
        role_id: 1, // super_admin role
        user_id: Number(superAdmin?.id ?? 1),
      });

      // Create super admin record
      const superAdminRepo = dataSource.getRepository(SuperAdmin);
      const savedSuperAdmin = await superAdminRepo.save({
        user_id: superAdmin.id,
        address: '1 Super Admin HQ',
      });

      // Create super admin wallet
      const superAdminWalletRepo = dataSource.getRepository(SuperAdminWallet);
      await superAdminWalletRepo.insert({
        super_admin_id: savedSuperAdmin.id,
        balance: 0,
        total_earnings: 0,
        total_spent: 0,
        pending_amount: 0,
        currency: 'USD',
        is_active: true,
      });

      // Create super admin settings
      const superAdminSettingsRepo = dataSource.getRepository(SuperAdminSettings);
      await superAdminSettingsRepo.insert({
        admin_annual_subscription_fee: 1199.00,
        temporary_merchant_packages_admin_commission_rate: 0.20, // 20%
        annual_merchant_packages_admin_commission_rate: 0.02, // 2%
        merchant_annual_fee: 1199.00,
        annual_merchant_subscription_admin_commission_rate: 0.75, // 75%
        currency: 'USD',
        is_active: true,
      });
    }

    const admin = await userRepo.findOne({
      where: { email: 'admin@must.services' },
    });

    if (admin) {
      await userHasRoleRepo.insert({
        role_id: 2, // admin role
        user_id: Number(admin?.id ?? 1),
      });

      // Create admin record
      const adminRepo = dataSource.getRepository(Admin);
      const savedAdmin = await adminRepo.save({
        user_id: admin.id,
        address: '123 Admin St',
      });

      // Create admin wallet with subscription fields
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const adminWalletRepo = dataSource.getRepository(AdminWallet);
      await adminWalletRepo.insert({
        admin_id: savedAdmin.id,
        balance: 0,
        total_earnings: 0,
        total_spent: 0,
        pending_amount: 0,
        currency: 'USD',
        subscription_type: 'annual',
        subscription_expires_at: oneYearFromNow,
        is_active: true,
      });
    }

    // Finance Viewer
    const financeViewer = await userRepo.findOne({
      where: { email: 'finance.viewer@must.services' },
    });

    if (financeViewer) {
      const financeViewerRole = await dataSource.getRepository('Role').findOne({
        where: { name: 'finance_viewer' },
      });

      if (financeViewerRole) {
        await userHasRoleRepo.insert({
          role_id: financeViewerRole.id,
          user_id: Number(financeViewer.id),
        });
      }
    }

    // Ad Approver
    const adApprover = await userRepo.findOne({
      where: { email: 'ad.approver@must.services' },
    });

    if (adApprover) {
      const adApproverRole = await dataSource.getRepository('Role').findOne({
        where: { name: 'ad_approver' },
      });

      if (adApproverRole) {
        await userHasRoleRepo.insert({
          role_id: adApproverRole.id,
          user_id: Number(adApprover.id),
        });
      }
    }

    // Support Staff
    const supportStaff = await userRepo.findOne({
      where: { email: 'support.staff@must.services' },
    });

    if (supportStaff) {
      const supportStaffRole = await dataSource.getRepository('Role').findOne({
        where: { name: 'support_staff' },
      });

      if (supportStaffRole) {
        await userHasRoleRepo.insert({
          role_id: supportStaffRole.id,
          user_id: Number(supportStaff.id),
        });
      }
    }

    // Create standalone customer (customers don't have user accounts)
    const customerRepo = dataSource.getRepository(Customer);
    await customerRepo.insert({
      name: 'Demo Customer',
      email: 'customer@must.services',
      phone: '+923001234567',
      address: '456 Customer St',
      gender: 'male',
    });

    console.info('Saving Users');
  }
}
