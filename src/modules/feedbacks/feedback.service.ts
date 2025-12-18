import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let customerId = createFeedbackDto.customerId;

      // If no customerId provided, create a new customer
      if (!customerId && (createFeedbackDto.customerEmail || createFeedbackDto.customerPhone)) {
        // Check if customer exists by email or phone
        let existingCustomer: Customer | null = null;
        
        if (createFeedbackDto.customerEmail) {
          existingCustomer = await this.customerRepository.findOne({
            where: { email: createFeedbackDto.customerEmail },
          });
        }
        
        if (!existingCustomer && createFeedbackDto.customerPhone) {
          existingCustomer = await this.customerRepository.findOne({
            where: { phone: createFeedbackDto.customerPhone },
          });
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          
          const customer = queryRunner.manager.create(Customer, {
            name: createFeedbackDto.customerName || 'Anonymous Customer',
            email: createFeedbackDto.customerEmail || `customer${Date.now()}@temp.local`,
            phone: createFeedbackDto.customerPhone || `+${Date.now()}`,
            password: hashedPassword,
            isActive: true,
          });
          const savedCustomer = await queryRunner.manager.save(customer);
          customerId = savedCustomer.id;
        }
      }

      // Create feedback
      const feedback = queryRunner.manager.create(Feedback, {
        merchantId: createFeedbackDto.merchantId,
        customerId: customerId,
        rating: createFeedbackDto.rating,
        comment: createFeedbackDto.comment,
      });
      const savedFeedback = await queryRunner.manager.save(feedback);

      await queryRunner.commitTransaction();

      // Load feedback with relations
      const feedbackWithRelations = await this.feedbackRepository.findOne({
        where: { id: savedFeedback.id },
        relations: ['merchant', 'customer'],
      });

      return {
        message: 'Feedback created successfully',
        data: feedbackWithRelations,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, merchantId?: number, customerId?: number) {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.merchant', 'merchant')
      .leftJoinAndSelect('feedback.customer', 'customer');

    if (merchantId) {
      queryBuilder.andWhere('feedback.merchantId = :merchantId', { merchantId });
    }

    if (customerId) {
      queryBuilder.andWhere('feedback.customerId = :customerId', { customerId });
    }

    queryBuilder
      .orderBy('feedback.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [feedbacks, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: feedbacks,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }
    return {
      message: 'Success fetching feedback',
      data: feedback,
    };
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }

    await this.feedbackRepository.update(id, updateFeedbackDto);
    const updatedFeedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });
    
    return {
      message: 'Feedback updated successfully',
      data: updatedFeedback,
    };
  }

  async remove(id: number) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new HttpException('Feedback not found', 404);
    }
    await this.feedbackRepository.softDelete(id);
    return {
      message: 'Feedback deleted successfully',
    };
  }
}
