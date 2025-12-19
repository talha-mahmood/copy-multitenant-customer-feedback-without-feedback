import { DataSource } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { Admin } from '../../../modules/admins/entities/admin.entity';
import { Merchant } from '../../../modules/merchants/entities/merchant.entity';
import { Customer } from '../../../modules/customers/entities/customer.entity';
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
      await adminRepo.insert({
        user_id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        password: admin.password,
        isActive: true,
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
      await merchantRepo.insert({
        user_id: merchant.id,
        business_name: 'Demo Business',
        business_type: 'Retail',
        merchant_type: 'permanent',
        address: '123 Business St',
        tax_id: 'TAX123456',
      });
    }

    const customer = await userRepo.findOne({
      where: { email: 'customer@must.services' },
    });

    if (customer) {
      await userHasRoleRepo.insert({
        role_id: 3,
        user_id: Number(customer?.id ?? 1),
      });

      // Create customer record
      const customerRepo = dataSource.getRepository(Customer);
      await customerRepo.insert({
        user_id: customer.id,
        address: '456 Customer St',
        gender: 'male',
      });
    }

    console.info('Saving Users');
  }
}
