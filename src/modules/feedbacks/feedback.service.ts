import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const feedback = this.feedbackRepository.create(createFeedbackDto);
    const savedFeedback = await this.feedbackRepository.save(feedback);
    return {
      message: 'Feedback created successfully',
      data: savedFeedback,
    };
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
