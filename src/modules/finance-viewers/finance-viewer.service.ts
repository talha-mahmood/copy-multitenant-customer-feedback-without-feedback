import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { FinanceViewer } from './entities/finance-viewer.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateFinanceViewerDto } from './dto/create-finance-viewer.dto';
import { UpdateFinanceViewerDto } from './dto/update-finance-viewer.dto';
import * as bcrypt from 'bcrypt';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogCategory, SystemLogLevel } from 'src/common/enums/system-log.enum';

@Injectable()
export class FinanceViewerService {
  constructor(
    @Inject('FINANCE_VIEWER_REPOSITORY')
    private financeViewerRepository: Repository<FinanceViewer>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private systemLogService: SystemLogService,
  ) {}

  async create(createDto: CreateFinanceViewerDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find finance_viewer role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'finance_viewer' },
      });
      if (!role) {
        throw new HttpException('Finance Viewer role not found', 404);
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

      // Create finance viewer
      const financeViewer = queryRunner.manager.create(FinanceViewer, {
        user_id: savedUser.id,
        address: createDto.address,
        city: createDto.city,
        country: createDto.country,
        notes: createDto.notes,
      });
      const saved = await queryRunner.manager.save(financeViewer);

      await queryRunner.commitTransaction();

      // Load with user relation
      const result = await this.financeViewerRepository.findOne({
        where: { id: saved.id },
        relations: ['user'],
      });

      // Log creation
      await this.systemLogService.log({
        category: SystemLogCategory.SYSTEM,
        action: SystemLogAction.CREATE,
        level: SystemLogLevel.INFO,
        message: `Finance Viewer ${createDto.name} created successfully`,
        userId: savedUser.id,
        userType: 'finance_viewer',
        entityType: 'finance_viewer',
        entityId: saved.id,
        metadata: {
          finance_viewer_id: saved.id,
          name: createDto.name,
          email: createDto.email,
        },
      });

      return {
        message: 'Finance Viewer created successfully',
        data: instanceToPlain(result),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create Finance Viewer',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.financeViewerRepository
      .createQueryBuilder('finance_viewer')
      .leftJoinAndSelect('finance_viewer.user', 'user');

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('finance_viewer.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Finance Viewers fetched successfully',
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
    const financeViewer = await this.financeViewerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!financeViewer) {
      throw new HttpException('Finance Viewer not found', 404);
    }

    return {
      message: 'Finance Viewer fetched successfully',
      data: instanceToPlain(financeViewer),
    };
  }

  async update(id: number, updateDto: UpdateFinanceViewerDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const financeViewer = await queryRunner.manager.findOne(FinanceViewer, {
        where: { id },
        relations: ['user'],
      });

      if (!financeViewer) {
        throw new HttpException('Finance Viewer not found', 404);
      }

      // Update user fields
      if (updateDto.name) financeViewer.user.name = updateDto.name;
      if (updateDto.email) financeViewer.user.email = updateDto.email;
      if (updateDto.phone) financeViewer.user.phone = updateDto.phone;
      if (updateDto.avatar) financeViewer.user.avatar = updateDto.avatar;
      if (updateDto.is_active !== undefined) financeViewer.user.is_active = updateDto.is_active;
      if (updateDto.password) {
        financeViewer.user.password = await bcrypt.hash(updateDto.password, 10);
      }

      await queryRunner.manager.save(financeViewer.user);

      // Update finance viewer fields
      if (updateDto.address) financeViewer.address = updateDto.address;
      if (updateDto.city) financeViewer.city = updateDto.city;
      if (updateDto.country) financeViewer.country = updateDto.country;
      if (updateDto.notes) financeViewer.notes = updateDto.notes;

      await queryRunner.manager.save(financeViewer);

      await queryRunner.commitTransaction();

      const updated = await this.financeViewerRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      return {
        message: 'Finance Viewer updated successfully',
        data: instanceToPlain(updated),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update Finance Viewer',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const financeViewer = await this.financeViewerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!financeViewer) {
      throw new HttpException('Finance Viewer not found', 404);
    }

    await this.financeViewerRepository.softDelete(id);

    return {
      message: 'Finance Viewer deleted successfully',
    };
  }
}
