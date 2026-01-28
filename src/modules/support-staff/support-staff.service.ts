import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { SupportStaff } from './entities/support-staff.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateSupportStaffDto } from './dto/create-support-staff.dto';
import { UpdateSupportStaffDto } from './dto/update-support-staff.dto';
import * as bcrypt from 'bcrypt';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogCategory, SystemLogLevel } from 'src/common/enums/system-log.enum';

@Injectable()
export class SupportStaffService {
  constructor(
    @Inject('SUPPORT_STAFF_REPOSITORY')
    private supportStaffRepository: Repository<SupportStaff>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private systemLogService: SystemLogService,
  ) {}

  async create(createDto: CreateSupportStaffDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find support_staff role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'support_staff' },
      });
      if (!role) {
        throw new HttpException('Support Staff role not found', 404);
      }

      const hashedPassword = await bcrypt.hash(createDto.password, 10);

      // Create user
      const user = queryRunner.manager.create(User, {
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone,
        password: hashedPassword,
        avatar: createDto.avatar || '',
        is_active: createDto.is_active !== undefined ? createDto.is_active : true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Assign role to user
      const userHasRole = queryRunner.manager.create(UserHasRole, {
        user_id: savedUser.id,
        role_id: role.id,
      });
      await queryRunner.manager.save(userHasRole);

      // Create support staff
      const supportStaff = queryRunner.manager.create(SupportStaff, {
        user_id: savedUser.id,
        address: createDto.address,
        city: createDto.city,
        country: createDto.country,
        notes: createDto.notes,
      });
      const saved = await queryRunner.manager.save(supportStaff);

      await queryRunner.commitTransaction();

      // Load with user relation
      const result = await this.supportStaffRepository.findOne({
        where: { id: saved.id },
        relations: ['user'],
      });

      // Log creation
      await this.systemLogService.log({
        category: SystemLogCategory.SYSTEM,
        action: SystemLogAction.CREATE,
        level: SystemLogLevel.INFO,
        message: `Support Staff ${createDto.name} created successfully`,
        userId: savedUser.id,
        userType: 'support_staff',
        entityType: 'support_staff',
        entityId: saved.id,
        metadata: {
          support_staff_id: saved.id,
          name: createDto.name,
          email: createDto.email,
        },
      });

      return {
        message: 'Support Staff created successfully',
        data: instanceToPlain(result),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create Support Staff',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.supportStaffRepository
      .createQueryBuilder('support_staff')
      .leftJoinAndSelect('support_staff.user', 'user');

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('support_staff.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Support Staff fetched successfully',
      data: instanceToPlain(items),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const supportStaff = await this.supportStaffRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!supportStaff) {
      throw new HttpException('Support Staff not found', 404);
    }

    return {
      message: 'Support Staff fetched successfully',
      data: instanceToPlain(supportStaff),
    };
  }

  async update(id: number, updateDto: UpdateSupportStaffDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const supportStaff = await queryRunner.manager.findOne(SupportStaff, {
        where: { id },
        relations: ['user'],
      });

      if (!supportStaff) {
        throw new HttpException('Support Staff not found', 404);
      }

      // Update user fields
      if (updateDto.name) supportStaff.user.name = updateDto.name;
      if (updateDto.email) supportStaff.user.email = updateDto.email;
      if (updateDto.phone) supportStaff.user.phone = updateDto.phone;
      if (updateDto.avatar) supportStaff.user.avatar = updateDto.avatar;
      if (updateDto.is_active !== undefined) supportStaff.user.is_active = updateDto.is_active;
      if (updateDto.password) {
        supportStaff.user.password = await bcrypt.hash(updateDto.password, 10);
      }

      await queryRunner.manager.save(supportStaff.user);

      // Update support staff fields
      if (updateDto.address) supportStaff.address = updateDto.address;
      if (updateDto.city) supportStaff.city = updateDto.city;
      if (updateDto.country) supportStaff.country = updateDto.country;
      if (updateDto.notes) supportStaff.notes = updateDto.notes;

      await queryRunner.manager.save(supportStaff);

      await queryRunner.commitTransaction();

      const updated = await this.supportStaffRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      return {
        message: 'Support Staff updated successfully',
        data: instanceToPlain(updated),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update Support Staff',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const supportStaff = await this.supportStaffRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!supportStaff) {
      throw new HttpException('Support Staff not found', 404);
    }

    await this.supportStaffRepository.softDelete(id);

    return {
      message: 'Support Staff deleted successfully',
    };
  }
}
