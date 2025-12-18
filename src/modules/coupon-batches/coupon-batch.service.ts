import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CouponBatch } from './entities/coupon-batch.entity';
import { CreateCouponBatchDto } from './dto/create-coupon-batch.dto';
import { UpdateCouponBatchDto } from './dto/update-coupon-batch.dto';
import { instanceToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { QRCodeHelper } from 'src/common/helpers/qrcode.helper';
import { Merchant } from '../merchants/entities/merchant.entity';

@Injectable()
export class CouponBatchService {
  constructor(
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    private configService: ConfigService,
  ) {}

  async create(createCouponBatchDto: CreateCouponBatchDto) {
    // Validate merchant exists and check merchant type
    const merchant = await this.merchantRepository.findOne({
      where: { id: createCouponBatchDto.merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${createCouponBatchDto.merchantId} not found`);
    }

    // Validate batch type based on merchant type
    await this.validateBatchType(merchant, createCouponBatchDto.batchType);

    // Validate dates
    if (new Date(createCouponBatchDto.startDate) >= new Date(createCouponBatchDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // For temporary batches, validate quantity
    if (createCouponBatchDto.batchType === 'temporary' && createCouponBatchDto.totalQuantity > 1000) {
      throw new BadRequestException('Temporary batch cannot exceed 1000 coupons');
    }

    const couponBatch = this.couponBatchRepository.create(createCouponBatchDto);
    const savedBatch = await this.couponBatchRepository.save(couponBatch);

    // Generate QR code URL and hash
    const qrData = this.generateBatchQRData(savedBatch.merchantId, savedBatch.id);
    
    return {
      message: 'Coupon batch created successfully',
      data: {
        ...instanceToPlain(savedBatch),
        qrCodeUrl: qrData.url,
        qrCodeImage: qrData.image,
      },
    };
  }

  /**
   * Validate batch type based on merchant type
   */
  private async validateBatchType(merchant: Merchant, batchType: string): Promise<void> {
    if (merchant.merchant_type === 'temporary' && batchType === 'annual') {
      throw new BadRequestException(
        'Temporary merchants can only create temporary batches',
      );
    }

    if (merchant.merchant_type === 'permanent' && batchType === 'temporary') {
      // Permanent merchants can create both types - no error
      return;
    }

    if (merchant.merchant_type === 'permanent' && batchType === 'annual') {
      // Permanent merchants can create annual batches - no error
      return;
    }
  }

  /**
   * Generate QR code data for batch
   */
  private generateBatchQRData(merchantId: number, batchId: number): { url: string; image: string } {
    const baseUrl = this.configService.get<string>('APP_FRONTEND_URL') || 'http://localhost:3000';
    const secret = this.configService.get<string>('APP_KEY') || 'default-secret';
    
    const url = QRCodeHelper.generateQRCodeUrl(merchantId, batchId, baseUrl, secret);
    
    return {
      url,
      image: url, // Placeholder - will generate actual QR image in next step
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, merchantId?: number) {
    if (pageSize > 500) {
      pageSize = 500;
    }

    const queryBuilder = this.couponBatchRepository
      .createQueryBuilder('couponBatch')
      .leftJoinAndSelect('couponBatch.merchant', 'merchant');

    if (merchantId) {
      queryBuilder.andWhere('couponBatch.merchantId = :merchantId', { merchantId });
    }

    const [results, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('couponBatch.created_at', 'DESC')
      .getManyAndCount();

    return {
      message: 'Coupon batches retrieved successfully',
      data: {
        batches: results.map((batch) => instanceToPlain(batch)),
        total,
        page,
        pageSize,
      },
    };
  }

  async findOne(id: number) {
    const couponBatch = await this.couponBatchRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!couponBatch) {
      throw new NotFoundException(`Coupon batch with ID ${id} not found`);
    }

    return {
      message: 'Coupon batch retrieved successfully',
      data: instanceToPlain(couponBatch),
    };
  }

  async update(id: number, updateCouponBatchDto: UpdateCouponBatchDto) {
    const couponBatch = await this.couponBatchRepository.findOne({ where: { id } });

    if (!couponBatch) {
      throw new NotFoundException(`Coupon batch with ID ${id} not found`);
    }

    Object.assign(couponBatch, updateCouponBatchDto);
    const updatedBatch = await this.couponBatchRepository.save(couponBatch);

    return {
      message: 'Coupon batch updated successfully',
      data: instanceToPlain(updatedBatch),
    };
  }

  async remove(id: number) {
    const couponBatch = await this.couponBatchRepository.findOne({ where: { id } });

    if (!couponBatch) {
      throw new NotFoundException(`Coupon batch with ID ${id} not found`);
    }

    await this.couponBatchRepository.softDelete(id);

    return {
      message: 'Coupon batch deleted successfully',
      data: null,
    };
  }
}
