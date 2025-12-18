import { DataSource } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { UserHasRole } from '../../../modules/roles-permission-management/user-has-role/entities/user-has-role.entity';

export async function seedUser(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const userHasRoleRepo = dataSource.getRepository(UserHasRole);

  const hashedPassword = await bcrypt.hash('Pakistan@123', 10);

  if ((await userRepo.createQueryBuilder('users').getCount()) === 0) {
    const users = Array.from({ length: 10 }).map(() => ({
      name: faker.person.fullName(),
      email: `${faker.internet.exampleEmail().split('@')[0]}@must.services`,
      password: hashedPassword,
      role: 'admin',
      phone: '03' + faker.string.numeric(9),
    }));

    users.push({
      name: 'Super Admin',
      email: 'super-admin@must.services',
      password: hashedPassword,
      role: 'super-admin',
      phone: '03001234567',
    });

    users.push({
      name: 'Administrator',
      email: 'admin@must.services',
      password: hashedPassword,
      role: 'admin',
      phone: '03001234567',
    });

    users.push({
      name: 'Resident',
      email: 'resident@must.services',
      password: hashedPassword,
      role: 'resident',
      phone: '03001234567',
    });

    users.push({
      name: 'Employee',
      email: 'employee@must.services',
      password: hashedPassword,
      role: 'employee',
      phone: '03001234567',
    });

    await userRepo.upsert(users, ['email']);

    const superAdmin = await userRepo.findOne({
      where: { email: 'super-admin@must.services' },
    });

    if (superAdmin) {
      await userHasRoleRepo.insert({
        role_id: 1,
        user_id: Number(superAdmin?.id ?? 1),
      });
    }

    const admin = await userRepo.findOne({
      where: { email: 'admin@must.services' },
    });

    if (admin) {
      await userHasRoleRepo.insert({
        role_id: 2,
        user_id: Number(admin?.id ?? 1),
      });
    }

    const employee = await userRepo.findOne({
      where: { email: 'employee@must.services' },
    });

    if (employee) {
      await userHasRoleRepo.insert({
        role_id: 3,
        user_id: Number(employee?.id ?? 1),
      });
    }

    const resident = await userRepo.findOne({
      where: { email: 'resident@must.services' },
    });

    if (resident) {
      await userHasRoleRepo.insert({
        role_id: 4,
        user_id: Number(resident?.id ?? 1),
      });
    }

    console.info('Saving Users');
  }
}
