import { Injectable, HttpException, Inject } from '@nestjs/common';
import { CreateUserHasRoleDto } from './dto/create-user-has-role.dto';
import { UpdateUserHasRoleDto } from './dto/update-user-has-role.dto';
import { UserHasRole } from './entities/user-has-role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserHasRoleService {
  constructor(
    @Inject('USER_HAS_ROLE_REPOSITORY')
    private userHasRoleRepository: Repository<UserHasRole>,
  ) {}

  async create(createUserHasRoleDto: CreateUserHasRoleDto) {
    try {
      const userHasRole = this.userHasRoleRepository.create(createUserHasRoleDto);
      const saved = await this.userHasRoleRepository.save(userHasRole);
      return {
        message: 'User role assigned successfully',
        data: saved,
      };
    } catch (error) {
      return {
        message: error.message,
        error: error,
      };
    }
  }

  async findAll(page = 1, pageSize = 20, search = '') {
    const [results, total] = await this.userHasRoleRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' },
    });

    if (total > 0) {
      return {
        message: 'User roles found',
        data: {
          userHasRoles: results,
          total,
          page,
          pageSize,
        },
      };
    }

    return {
      message: 'No user roles found',
      data: {
        userHasRoles: [],
        total: 0,
        page,
        pageSize,
      },
    };
  }

  async findOne(id: number) {
    const userHasRole = await this.userHasRoleRepository.findOne({ where: { id } });
    return {
      message: userHasRole ? 'User role found' : 'User role not found',
      data: userHasRole,
    };
  }

  async update(id: number, updateUserHasRoleDto: UpdateUserHasRoleDto) {
    const result = await this.userHasRoleRepository.update(id, updateUserHasRoleDto);
    if (result?.affected && result?.affected > 0) {
      const updated = await this.userHasRoleRepository.findOne({ where: { id } });
      return {
        message: 'User role updated successfully',
        data: updated,
      };
    }
    throw new HttpException('No user role found to update', 400);
  }

  async remove(id: number) {
    const result = await this.userHasRoleRepository.delete(id);
    if (result?.affected && result?.affected > 0) {
      return {
        message: 'User role deleted successfully',
      };
    }
    throw new HttpException('No user role found to delete', 400);
  }

  async findByUserId(userId: number) {
    const roles = await this.userHasRoleRepository.findOne({ where: { user_id: userId }, relations: ['role'] });
    return {
      message: roles ? 'User roles found for user' : 'No roles found for user',
      data: roles,
    };
  }
}