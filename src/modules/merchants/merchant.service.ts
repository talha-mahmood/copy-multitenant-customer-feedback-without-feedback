import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MerchantService {
  constructor(
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
  ) {}

  async create(createMerchantDto: CreateMerchantDto) {
    const hashedPassword = await bcrypt.hash(createMerchantDto.password, 10);
    const merchant = this.merchantRepository.create({
      ...createMerchantDto,
      password: hashedPassword,
    });
    const savedMerchant = await this.merchantRepository.save(merchant);
    return {
      message: 'Merchant created successfully',
      data: instanceToPlain(savedMerchant),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.merchantRepository.createQueryBuilder('merchant');

    if (search) {
      queryBuilder.andWhere(
        '(merchant.name ILIKE :search OR merchant.email ILIKE :search OR merchant.businessName ILIKE :search OR merchant.phone ILIKE :search)',
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
    const merchant = await this.merchantRepository.findOne({ where: { id } });
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

    if (updateMerchantDto.password) {
      updateMerchantDto.password = await bcrypt.hash(updateMerchantDto.password, 10);
    }

    await this.merchantRepository.update(id, updateMerchantDto);
    const updatedMerchant = await this.merchantRepository.findOne({ where: { id } });
    
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
