import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CouponService {
  constructor(
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const coupon = this.couponRepository.create({
      ...createCouponDto,
      issued_at: new Date(),
    });
    const savedCoupon = await this.couponRepository.save(coupon);
    
    return {
      message: 'Coupon created successfully',
      data: instanceToPlain(savedCoupon),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, filters?: {
    merchantId?: number;
    customerId?: number;
    batchId?: number;
    status?: string;
  }) {
    if (pageSize > 500) {
      pageSize = 500;
    }

    const queryBuilder = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.merchant', 'merchant')
      .leftJoinAndSelect('coupon.customer', 'customer')
      .leftJoinAndSelect('coupon.batch', 'batch');

    if (filters?.merchantId) {
      queryBuilder.andWhere('coupon.merchant_id = :merchantId', { merchantId: filters.merchantId });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('coupon.customer_id = :customerId', { customerId: filters.customerId });
    }

    if (filters?.batchId) {
      queryBuilder.andWhere('coupon.batch_id = :batchId', { batchId: filters.batchId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('coupon.status = :status', { status: filters.status });
    }

    const [results, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('coupon.created_at', 'DESC')
      .getManyAndCount();

    return {
      message: 'Coupons retrieved successfully',
      data: {
        coupons: results.map((coupon) => instanceToPlain(coupon)),
        total,
        page,
        pageSize,
      },
    };
  }

  async findOne(id: number) {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer', 'batch'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return {
      message: 'Coupon retrieved successfully',
      data: instanceToPlain(coupon),
    };
  }

  async findByCode(couponCode: string) {
    const coupon = await this.couponRepository.findOne({
      where: { coupon_code: couponCode },
      relations: ['merchant', 'customer', 'batch'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${couponCode} not found`);
    }

    return {
      message: 'Coupon retrieved successfully',
      data: instanceToPlain(coupon),
    };
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.couponRepository.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    Object.assign(coupon, updateCouponDto);
    const updatedCoupon = await this.couponRepository.save(coupon);

    return {
      message: 'Coupon updated successfully',
      data: instanceToPlain(updatedCoupon),
    };
  }

  async remove(id: number) {
    const coupon = await this.couponRepository.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    await this.couponRepository.softDelete(id);

    return {
      message: 'Coupon deleted successfully',
      data: null,
    };
  }
}
