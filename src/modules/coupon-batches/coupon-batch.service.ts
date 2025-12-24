import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CouponBatch } from './entities/coupon-batch.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CreateCouponBatchDto } from './dto/create-coupon-batch.dto';
import { UpdateCouponBatchDto } from './dto/update-coupon-batch.dto';
import { instanceToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { QRCodeHelper } from 'src/common/helpers/qrcode.helper';
import { CouponCodeGenerator } from 'src/common/helpers/coupon-code-generator.helper';
import { PdfExportHelper } from 'src/common/helpers/pdf-export.helper';
import { In } from 'typeorm';
import { Merchant } from '../merchants/entities/merchant.entity';

@Injectable()
export class CouponBatchService {
  constructor(
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async create(createCouponBatchDto: CreateCouponBatchDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate merchant exists and check merchant type
      const merchant = await this.merchantRepository.findOne({
        where: { id: createCouponBatchDto.merchant_id },
      });

      if (!merchant) {
        throw new NotFoundException(`Merchant with ID ${createCouponBatchDto.merchant_id} not found`);
      }

      // Validate batch type based on merchant type
      await this.validateBatchType(merchant, createCouponBatchDto.batch_type);

      // Validate dates
      if (new Date(createCouponBatchDto.start_date) >= new Date(createCouponBatchDto.end_date)) {
        throw new BadRequestException('Start date must be before end date');
      }

      // For temporary batches, validate quantity
      if (createCouponBatchDto.batch_type === 'temporary' && createCouponBatchDto.total_quantity > 1000) {
        throw new BadRequestException('Temporary batch cannot exceed 1000 coupons');
      }

      // Create batch
      const couponBatch = queryRunner.manager.create(CouponBatch, createCouponBatchDto);
      const savedBatch = await queryRunner.manager.save(couponBatch);

      // Auto-generate coupons for the batch
      const coupons: Coupon[] = [];
      const secret = this.configService.get<string>('APP_KEY') || 'default-secret';
      
      for (let i = 0; i < createCouponBatchDto.total_quantity; i++) {
        const couponCode = CouponCodeGenerator.generate('CPN');
        const qrHash = QRCodeHelper.generateHash(savedBatch.merchant_id, savedBatch.id, secret);
        const coupon = queryRunner.manager.create(Coupon, {
          batch_id: savedBatch.id,
          merchant_id: savedBatch.merchant_id,
          coupon_code: couponCode,
          qr_hash: qrHash,
          status: 'issued',
          issued_at: new Date(),
          template_id: createCouponBatchDto.template_id,
          header: createCouponBatchDto.header,
          title: createCouponBatchDto.title,
          description: createCouponBatchDto.description,
        });
        coupons.push(coupon);
      }

      await queryRunner.manager.save(Coupon, coupons);
      await queryRunner.commitTransaction();
      
      return {
        message: `Coupon batch created successfully with ${coupons.length} coupons`,
        data: {
          ...instanceToPlain(savedBatch),
          couponsGenerated: coupons.length,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    if (merchant.merchant_type === 'annual') {
      // Annual merchants can create both temporary and annual batches
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

  async findAll(page: number = 1, pageSize: number = 20, filters?: {
    merchantId?: number;
  }) {
    if (pageSize > 500) {
      pageSize = 500;
    }

    const queryBuilder = this.couponBatchRepository
      .createQueryBuilder('couponBatch')
      .leftJoinAndSelect('couponBatch.merchant', 'merchant');

    if (filters?.merchantId) {
      queryBuilder.andWhere('couponBatch.merchantId = :merchantId', { merchantId : filters?.merchantId });
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


    /**
   * Export a single coupon batch and its coupons as PDF (base64)
   */
  async exportBatchPdf(batchId: number) {
    const batch = await this.couponBatchRepository.findOne({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException('Coupon batch not found');
    }
    const coupons = await this.couponRepository.find({ where: { batch_id: batchId } });
    const batchObj = {
      id: batch.id,
      batch_name: batch.batch_name,
      batch_type: batch.batch_type,
      start_date: batch.start_date,
      end_date: batch.end_date,
      total_quantity: batch.total_quantity,
    };
    const couponObjs = coupons.map(c => ({
      id: c.id,
      batch_id: c.batch_id,
      code: c.coupon_code,
      status: c.status,
    }));
    const pdfBuffer = await PdfExportHelper.generateCouponBatchesPdf([batchObj], couponObjs);
    const base64 = pdfBuffer.toString('base64');
    return {
      message: 'PDF export generated successfully',
      data: { base64 },
    };
  }
}
