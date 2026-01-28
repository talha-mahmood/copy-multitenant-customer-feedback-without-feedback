import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SuperadminRole } from './entities/superadmin-role.entity';
import { CreateSuperadminRoleDto } from './dto/create-superadmin-role.dto';
import { UpdateSuperadminRoleDto } from './dto/update-superadmin-role.dto';
import * as bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class SuperadminRoleService {
    constructor(
        @Inject('SUPERADMIN_ROLE_REPOSITORY')
        private superadminRoleRepository: Repository<SuperadminRole>,
    ) { }

    async create(createSuperadminRoleDto: CreateSuperadminRoleDto) {
        // Check if email already exists
        const existingStaff = await this.superadminRoleRepository.findOne({
            where: { email: createSuperadminRoleDto.email },
        });

        if (existingStaff) {
            throw new ConflictException('Email already exists');
        }

        if (!createSuperadminRoleDto.admin_role && !createSuperadminRoleDto.role) {
            throw new ConflictException('Admin role is required');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createSuperadminRoleDto.password, 10);

        const staff = this.superadminRoleRepository.create({
            ...createSuperadminRoleDto,
            admin_role: createSuperadminRoleDto.role || createSuperadminRoleDto.admin_role,
            password: hashedPassword,
        });

        const saved = await this.superadminRoleRepository.save(staff);

        return {
            message: 'Staff account created successfully',
            data: instanceToPlain(saved),
        };
    }

    async findAll(page: number = 1, pageSize: number = 20, search: string = '') {
        const queryBuilder = this.superadminRoleRepository
            .createQueryBuilder('staff')
            .select([
                'staff.id',
                'staff.name',
                'staff.email',
                'staff.phone',
                'staff.admin_role',
                'staff.is_active',
                'staff.created_at',
                'staff.updated_at',
            ]);

        if (search) {
            queryBuilder.where(
                '(staff.name ILIKE :search OR staff.email ILIKE :search OR staff.phone ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        queryBuilder
            .orderBy('staff.created_at', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [staff, total] = await queryBuilder.getManyAndCount();

        return {
            message: 'Success',
            data: instanceToPlain(staff),
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findOne(id: number) {
        const staff = await this.superadminRoleRepository.findOne({
            where: { id },
            select: ['id', 'name', 'email', 'phone', 'admin_role', 'is_active', 'created_at', 'updated_at'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff with ID ${id} not found`);
        }

        return {
            message: 'Success',
            data: instanceToPlain(staff),
        };
    }

    async update(id: number, updateSuperadminRoleDto: UpdateSuperadminRoleDto) {
        const staff = await this.superadminRoleRepository.findOne({
            where: { id },
        });

        if (!staff) {
            throw new NotFoundException(`Staff with ID ${id} not found`);
        }

        // Check email uniqueness if email is being updated
        if (updateSuperadminRoleDto.email && updateSuperadminRoleDto.email !== staff.email) {
            const existingStaff = await this.superadminRoleRepository.findOne({
                where: { email: updateSuperadminRoleDto.email },
            });

            if (existingStaff) {
                throw new ConflictException('Email already exists');
            }
        }

        // Hash password if provided
        if (updateSuperadminRoleDto.password) {
            updateSuperadminRoleDto.password = await bcrypt.hash(updateSuperadminRoleDto.password, 10);
        }

        if (updateSuperadminRoleDto.role) {
            updateSuperadminRoleDto.admin_role = updateSuperadminRoleDto.role;
        }

        Object.assign(staff, updateSuperadminRoleDto);

        const updated = await this.superadminRoleRepository.save(staff);

        return {
            message: 'Staff account updated successfully',
            data: instanceToPlain(updated),
        };
    }

    async remove(id: number) {
        const staff = await this.superadminRoleRepository.findOne({
            where: { id },
        });

        if (!staff) {
            throw new NotFoundException(`Staff with ID ${id} not found`);
        }

        await this.superadminRoleRepository.softDelete(id);

        return {
            message: 'Staff account deleted successfully',
            data: null,
        };
    }
}
