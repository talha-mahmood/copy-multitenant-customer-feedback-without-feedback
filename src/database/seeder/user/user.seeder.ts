import { DataSource } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { Admin } from '../../../modules/admins/entities/admin.entity';
import { Merchant } from '../../../modules/merchants/entities/merchant.entity';
import { Customer } from '../../../modules/customers/entities/customer.entity';
import { AdminWallet } from '../../../modules/wallets/entities/admin-wallet.entity';
import { MerchantWallet } from '../../../modules/wallets/entities/merchant-wallet.entity';
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
      name: 'Administrator',
      email: 'admin@must.services',
      password: hashedPassword,
      role: 'admin',
      phone: '03001234567',
    });

    users.push({
      name: 'Merchant User',
      email: 'merchant@must.services',
      password: hashedPassword,
      role: 'merchant',
      phone: '03001234568',
    });

    users.push({
      name: 'Customer User',
      email: 'customer@must.services',
      password: hashedPassword,
      role: 'customer',
      phone: '03001234569',
    });

    await userRepo.upsert(users, ['email']);

    const admin = await userRepo.findOne({
      where: { email: 'admin@must.services' },
    });

    if (admin) {
      await userHasRoleRepo.insert({
        role_id: 1,
        user_id: Number(admin?.id ?? 1),
      });

      // Create admin record
      const adminRepo = dataSource.getRepository(Admin);
      const savedAdmin = await adminRepo.save({
        user_id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        password: admin.password,
        isActive: true,
      });

      // Create admin wallet
      const adminWalletRepo = dataSource.getRepository(AdminWallet);
      await adminWalletRepo.insert({
        admin_id: savedAdmin.id,
        balance: 0,
        total_earnings: 0,
        total_spent: 0,
        pending_amount: 0,
        currency: 'USD',
        is_active: true,
      });
    }

    const merchant = await userRepo.findOne({
      where: { email: 'merchant@must.services' },
    });

    if (merchant) {
      await userHasRoleRepo.insert({
        role_id: 2,
        user_id: Number(merchant?.id ?? 1),
      });

      // Create merchant record
      const merchantRepo = dataSource.getRepository(Merchant);
      const savedMerchant = await merchantRepo.save({
        user_id: merchant.id,
        business_name: 'Demo Business',
        business_type: 'Retail',
        merchant_type: 'annual',
        address: '123 Business St',
        tax_id: 'TAX123456',
      });

      // Create merchant wallet
      const merchantWalletRepo = dataSource.getRepository(MerchantWallet);
      await merchantWalletRepo.insert({
        merchant_id: savedMerchant.id,
        whatsapp_message_credits: 0,
        paid_ad_credits: 0,
        coupon_credits: 0,
        total_credits_purchased: 0,
        total_credits_used: 0,
        subscription_type: 'annual',
        annual_fee_paid: false,
        currency: 'USD',
        is_active: true,
      });
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
