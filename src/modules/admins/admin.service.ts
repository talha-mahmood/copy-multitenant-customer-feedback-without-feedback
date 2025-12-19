import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { WalletService } from '../wallets/wallet.service';

@Injectable()
export class AdminService {
  constructor(
    @Inject('ADMIN_REPOSITORY')
    private adminRepository: Repository<Admin>,
    private walletService: WalletService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);
    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });
    const savedAdmin = await this.adminRepository.save(admin);

    // Create admin wallet
    await this.walletService.createAdminWallet(savedAdmin.id);
    return {
      message: 'Admin created successfully',
      data: instanceToPlain(savedAdmin),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.adminRepository.createQueryBuilder('admin');

    if (search) {
      queryBuilder.andWhere(
        '(admin.name ILIKE :search OR admin.email ILIKE :search OR admin.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('admin.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [admins, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(admins),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }
    return {
      message: 'Success fetching admin',
      data: instanceToPlain(admin),
    };
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    await this.adminRepository.update(id, updateAdminDto);
    const updatedAdmin = await this.adminRepository.findOne({ where: { id } });
    
    return {
      message: 'Admin updated successfully',
      data: instanceToPlain(updatedAdmin),
    };
  }

  async remove(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }
    await this.adminRepository.softDelete(id);
    return {
      message: 'Admin deleted successfully',
    };
  }
}
