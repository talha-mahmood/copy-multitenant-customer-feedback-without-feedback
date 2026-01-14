import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { SuperAdmin } from './entities/super-admin.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject('SUPER_ADMIN_REPOSITORY')
    private superAdminRepository: Repository<SuperAdmin>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  async create(createSuperAdminDto: CreateSuperAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find super_admin role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'super_admin' },
      });
      if (!role) {
        throw new HttpException('Super Admin role not found', 404);
      }

      const hashedPassword = await bcrypt.hash(createSuperAdminDto.password, 10);
      
      // Create user
      const user = queryRunner.manager.create(User, {
        name: createSuperAdminDto.name,
        email: createSuperAdminDto.email,
        phone: createSuperAdminDto.phone,
        password: hashedPassword,
        avatar: '',
        is_active: true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Assign role to user
      const userHasRole = queryRunner.manager.create(UserHasRole, {
        user_id: savedUser.id,
        role_id: role.id,
      });
      await queryRunner.manager.save(userHasRole);

      // Create super admin
      const superAdmin = queryRunner.manager.create(SuperAdmin, {
        user_id: savedUser.id,
        address: createSuperAdminDto.address,
      });
      const savedSuperAdmin = await queryRunner.manager.save(superAdmin);

      await queryRunner.commitTransaction();

      return {
        message: 'Super Admin created successfully',
        data: instanceToPlain(savedSuperAdmin),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '', isActive?: boolean) {
    const queryBuilder = this.superAdminRepository
      .createQueryBuilder('superAdmin')
      .leftJoinAndSelect('superAdmin.user', 'user')
      .where('user.deleted_at IS NULL');
      
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('superAdmin.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [superAdmins, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(superAdmins),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }
    return {
      message: 'Success fetching super admin',
      data: instanceToPlain(superAdmin),
    };
  }

  async update(id: number, updateSuperAdminDto: UpdateSuperAdminDto) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const user = await userRepo.findOne({ where: { id: superAdmin.user_id } });

      if (!user) {
        throw new HttpException('User not found', 404);
      }

      // Update user fields
      if (updateSuperAdminDto.name !== undefined) {
        user.name = updateSuperAdminDto.name;
      }
      if (updateSuperAdminDto.email !== undefined) {
        user.email = updateSuperAdminDto.email;
      }
      if (updateSuperAdminDto.phone !== undefined) {
        user.phone = updateSuperAdminDto.phone;
      }
      if (updateSuperAdminDto.password) {
        user.password = await bcrypt.hash(updateSuperAdminDto.password, 10);
      }

      await queryRunner.manager.save(user);

      // Update super admin fields
      if (updateSuperAdminDto.address !== undefined) {
        superAdmin.address = updateSuperAdminDto.address;
      }

      const updatedSuperAdmin = await queryRunner.manager.save(superAdmin);

      await queryRunner.commitTransaction();

      const result = await this.superAdminRepository.findOne({
        where: { id: updatedSuperAdmin.id },
        relations: ['user'],
      });

      return {
        message: 'Super Admin updated successfully',
        data: instanceToPlain(result),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete super admin
      await queryRunner.manager.softDelete(SuperAdmin, id);
      
      // Soft delete associated user
      await queryRunner.manager.softDelete(User, superAdmin.user_id);

      await queryRunner.commitTransaction();

      return {
        message: 'Super Admin deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to delete super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
