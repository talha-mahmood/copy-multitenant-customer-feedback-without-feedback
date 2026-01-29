import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { AdApprover } from './entities/ad-approver.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateAdApproverDto } from './dto/create-ad-approver.dto';
import { UpdateAdApproverDto } from './dto/update-ad-approver.dto';
import * as bcrypt from 'bcrypt';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogCategory, SystemLogLevel } from 'src/common/enums/system-log.enum';

@Injectable()
export class AdApproverService {
  constructor(
    @Inject('AD_APPROVER_REPOSITORY')
    private adApproverRepository: Repository<AdApprover>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private systemLogService: SystemLogService,
  ) {}

  async create(createDto: CreateAdApproverDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find ad_approver role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'ad_approver' },
      });
      if (!role) {
        throw new HttpException('Ad Approver role not found', 404);
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

      // Create ad approver
      const adApprover = queryRunner.manager.create(AdApprover, {
        user_id: savedUser.id,
        address: createDto.address,
        city: createDto.city,
        country: createDto.country,
        notes: createDto.notes,
      });
      const saved = await queryRunner.manager.save(adApprover);

      await queryRunner.commitTransaction();

      // Load with user relation
      const result = await this.adApproverRepository.findOne({
        where: { id: saved.id },
        relations: ['user'],
      });

      // Log creation
      await this.systemLogService.log({
        category: SystemLogCategory.SYSTEM,
        action: SystemLogAction.CREATE,
        level: SystemLogLevel.INFO,
        message: `Ad Approver ${createDto.name} created successfully`,
        userId: savedUser.id,
        userType: 'ad_approver',
        entityType: 'ad_approver',
        entityId: saved.id,
        metadata: {
          ad_approver_id: saved.id,
          name: createDto.name,
          email: createDto.email,
        },
      });

      return {
        message: 'Ad Approver created successfully',
        data: instanceToPlain(result),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create Ad Approver',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.adApproverRepository
      .createQueryBuilder('ad_approver')
      .leftJoinAndSelect('ad_approver.user', 'user');

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('ad_approver.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Ad Approvers fetched successfully',
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
    const adApprover = await this.adApproverRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!adApprover) {
      throw new HttpException('Ad Approver not found', 404);
    }

    return {
      message: 'Ad Approver fetched successfully',
      data: instanceToPlain(adApprover),
    };
  }

  async update(id: number, updateDto: UpdateAdApproverDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adApprover = await queryRunner.manager.findOne(AdApprover, {
        where: { id },
        relations: ['user'],
      });

      if (!adApprover) {
        throw new HttpException('Ad Approver not found', 404);
      }

      // Update user fields
      if (updateDto.name) adApprover.user.name = updateDto.name;
      if (updateDto.email) adApprover.user.email = updateDto.email;
      if (updateDto.phone) adApprover.user.phone = updateDto.phone;
      if (updateDto.avatar) adApprover.user.avatar = updateDto.avatar;
      if (updateDto.is_active !== undefined) adApprover.user.is_active = updateDto.is_active;
      if (updateDto.password) {
        adApprover.user.password = await bcrypt.hash(updateDto.password, 10);
      }

      await queryRunner.manager.save(adApprover.user);

      // Update ad approver fields
      if (updateDto.address) adApprover.address = updateDto.address;
      if (updateDto.city) adApprover.city = updateDto.city;
      if (updateDto.country) adApprover.country = updateDto.country;
      if (updateDto.notes) adApprover.notes = updateDto.notes;

      await queryRunner.manager.save(adApprover);

      await queryRunner.commitTransaction();

      const updated = await this.adApproverRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      return {
        message: 'Ad Approver updated successfully',
        data: instanceToPlain(updated),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update Ad Approver',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const adApprover = await this.adApproverRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!adApprover) {
      throw new HttpException('Ad Approver not found', 404);
    }

    await this.adApproverRepository.softDelete(id);

    return {
      message: 'Ad Approver deleted successfully',
    };
  }
}
