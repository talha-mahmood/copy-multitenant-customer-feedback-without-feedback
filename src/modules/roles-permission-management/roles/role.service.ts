import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Role as RoleEnum } from '../../../common/enums/role.enum';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from '../../../common/decorators/current-user';

@Injectable()
export class RoleService {
  constructor(
    @Inject('ROLE_REPOSITORY')
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(user: User, search: string = '') {
    const query = this.roleRepository.createQueryBuilder('roles');
    if (user && user.role) {
      const userRole = await this.roleRepository.findOneBy({ id: user.role });
      const userRoleName = userRole ? userRole.name : null;
      if (userRoleName !== RoleEnum.SUPER_ADMIN) {
        query.where('roles.name != :superAdmin AND roles.name != :resident', {
          superAdmin: RoleEnum.SUPER_ADMIN,
          resident: RoleEnum.RESIDENT,
        });
      }
    }

    if (search) {
      query.andWhere(
        '(roles.name ILIKE :search OR roles.display_name ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    return await query.orderBy('roles.display_name', 'ASC').getMany();
  }

  async findOne(id: number) {
    return this.roleRepository.findOneBy({ id });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.roleRepository.update(id, updateRoleDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
  }
}
