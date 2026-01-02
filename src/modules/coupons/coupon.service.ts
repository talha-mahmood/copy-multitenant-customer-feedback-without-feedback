import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CouponService {
  constructor(
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
  ) { }

  /**
   * Redeem a coupon by its unique coupon_code. Can only be redeemed once.
   */

  async redeemCoupon(couponCode: string) {
    const coupon = await this.couponRepository.findOne({ where: { coupon_code: couponCode } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    if (coupon.status === 'redeemed') {
      return { message: 'Coupon already redeemed', data: instanceToPlain(coupon) };
    }
    coupon.status = 'redeemed';
    coupon.redeemed_at = new Date();
    await this.couponRepository.save(coupon);
    return { message: 'Coupon redeemed successfully', data: instanceToPlain(coupon) };
  }

  async create(createCouponDto: CreateCouponDto) {
    const coupon = this.couponRepository.create({
      ...createCouponDto,
      issued_at: new Date(),
      template_id: createCouponDto.template_id,
      header: createCouponDto.header,
      title: createCouponDto.title,
      description: createCouponDto.description,
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

  async findAllPublic(page: number = 1, pageSize: number = 20, businessType?: string) {
    if (pageSize > 500) {
      pageSize = 500;
    }

    const merchantRepository = this.couponRepository.manager.getRepository(Merchant);
    const queryBuilder = merchantRepository
      .createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.batches', 'batch')
      .leftJoinAndSelect('batch.template', 'template')
      .leftJoinAndSelect('merchant.user', 'user') // Optional: if you need user details
      .where('batch.is_active = :isActive', { isActive: true });

    if (businessType) {
      queryBuilder.andWhere('merchant.business_type = :businessType', { businessType });
    }

    try {
      const [results, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('merchant.created_at', 'DESC')
        .getManyAndCount();

      // Process results to inject rendered HTML
      const processedMerchants = await Promise.all(results.map(async (merchant) => {
        const plainMerchant = instanceToPlain(merchant);

        if (plainMerchant.batches) {
          plainMerchant.batches = await Promise.all(plainMerchant.batches.map(async (batch) => {
            let renderedHtml = batch.template?.html || '';

            // Check if we need fallback data from Coupon table (for legacy batches)
            let header = batch.header;
            let title = batch.title;
            let description = batch.description;

            if (!header || !title || !description) {
              // Fetch one representative coupon for this batch to get the metadata
              const representativeCoupon = await this.couponRepository.findOne({
                where: { batch_id: batch.id },
                select: ['header', 'title', 'description']
              });

              if (representativeCoupon) {
                header = header || representativeCoupon.header;
                title = title || representativeCoupon.title;
                description = description || representativeCoupon.description;
              }
            }

            // Inject dynamic fields if HTML exists
            if (renderedHtml) {
              const replacements = {
                '{{header}}': header || '',
                '{{title}}': title || '',
                '{{description}}': description || ''
              };

              Object.keys(replacements).forEach((placeholder) => {
                const regex = new RegExp(placeholder.replace('{{', '{{\\s*').replace('}}', '\\s*}}'), 'gi');
                renderedHtml = renderedHtml.replace(regex, replacements[placeholder]);
              });
            }

            return {
              ...batch,
              // Return the resolved values as well, for clarity
              header,
              title,
              description,
              rendered_html: renderedHtml,
            };
          }));
        }

        return plainMerchant;
      }));

      return {
        message: 'Public merchants with coupons retrieved successfully',
        data: {
          merchants: processedMerchants,
          total,
          page,
          pageSize,
        },
      };
    } catch (error) {
      console.error('Error in findAllPublic:', error);
      throw error;
    }
  }

  async findOne(id: number, user: { id: number; role: number | string; merchantId?: number | null }) {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer', 'batch'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // Allow admin or merchant who owns the coupon
    const isAdmin = user.role === "admin";
    if (!isAdmin && coupon.merchant_id !== user.merchantId) {
      throw new NotFoundException('Coupon not found');
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
