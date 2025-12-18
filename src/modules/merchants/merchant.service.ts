import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MerchantService {
  constructor(
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('ROLE_REPOSITORY')
    private roleRepository: Repository<Role>,
    @Inject('USER_HAS_ROLE_REPOSITORY')
    private userHasRoleRepository: Repository<UserHasRole>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  async create(createMerchantDto: CreateMerchantDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createMerchantDto.email },
      });
      if (existingUser) {
        throw new HttpException('User with this email already exists', 400);
      }

      // Find role by name
      const role = await this.roleRepository.findOne({
        where: { name: createMerchantDto.role },
      });
      if (!role) {
        throw new HttpException('Role not found', 404);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createMerchantDto.password, 10);

      // Create user
      const user = queryRunner.manager.create(User, {
        name: `${createMerchantDto.firstName} ${createMerchantDto.lastName}`,
        email: createMerchantDto.email,
        password: hashedPassword,
        phone: '', // Optional, can be added to DTO if needed
        avatar: '',
        isActive: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Assign role to user
      const userHasRole = queryRunner.manager.create(UserHasRole, {
        user_id: savedUser.id,
        role_id: role.id,
      });
      await queryRunner.manager.save(userHasRole);

      // Create merchant
      const merchant = queryRunner.manager.create(Merchant, {
        user_id: savedUser.id,
        address: createMerchantDto.address,
        business_name: createMerchantDto.business_name,
        business_type: createMerchantDto.business_type,
        merchant_type: createMerchantDto.merchant_type,
        tax_id: createMerchantDto.tax_id,
      });
      const savedMerchant = await queryRunner.manager.save(merchant);

      await queryRunner.commitTransaction();

      // Load the merchant with user relation
      const merchantWithUser = await this.merchantRepository.findOne({
        where: { id: savedMerchant.id },
        relations: ['user'],
      });

      return {
        message: 'Merchant created successfully',
        data: instanceToPlain(merchantWithUser),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create merchant',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.merchantRepository
      .createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search OR merchant.business_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('merchant.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [merchants, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(merchants),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }
    return {
      message: 'Success fetching merchant',
      data: instanceToPlain(merchant),
    };
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto) {
    const merchant = await this.merchantRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }

    await this.merchantRepository.update(id, updateMerchantDto);
    const updatedMerchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    return {
      message: 'Merchant updated successfully',
      data: instanceToPlain(updatedMerchant),
    };
  }

  async remove(id: number) {
    const merchant = await this.merchantRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }
    await this.merchantRepository.softDelete(id);
    return {
      message: 'Merchant deleted successfully',
    };
  }
}
