import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
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
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('ROLE_REPOSITORY')
    private roleRepository: Repository<Role>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createFeedbackDto.email },
      });

      if (existingUser) {
        throw new HttpException('User with this email already exists', 400);
      }

      // 1. Create User
      const hashedPassword = await bcrypt.hash(createFeedbackDto.password, 10);
      const user = queryRunner.manager.create(User, {
        name: `${createFeedbackDto.firstName} ${createFeedbackDto.lastName}`,
        email: createFeedbackDto.email,
        phone: createFeedbackDto.phoneNumber,
        password: hashedPassword,
        is_active: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Find customer role
      const customerRole = await this.roleRepository.findOne({
        where: { name: 'customer' },
      });

      if (!customerRole) {
        throw new HttpException('Customer role not found', 404);
      }

      // 3. Assign customer role to user
      await queryRunner.manager.query(
        'INSERT INTO user_has_role (user_id, role_id) VALUES ($1, $2)',
        [savedUser.id, customerRole.id],
      );

      // 4. Create Customer
      const customerData: any = {
        user_id: savedUser.id,
        address: createFeedbackDto.address,
        gender: createFeedbackDto.gender,
      };
      
      if (createFeedbackDto.date_of_birth) {
        // Parse DD-MM-YYYY format to YYYY-MM-DD
        const [day, month, year] = createFeedbackDto.date_of_birth.split('-');
        customerData.date_of_birth = `${year}-${month}-${day}`;
      }
      
      const customer = queryRunner.manager.create(Customer, customerData);
      const savedCustomer = await queryRunner.manager.save(customer);

      // 5. Create Feedback
      const feedback = queryRunner.manager.create(Feedback, {
        merchant_id: createFeedbackDto.merchantId,
        customer_id: savedCustomer.id,
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
        message: 'Feedback created successfully. User and customer account have been created.',
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
      queryBuilder.andWhere('feedback.merchant_id = :merchantId', { merchantId });
    }

    if (customerId) {
      queryBuilder.andWhere('feedback.customer_id = :customerId', { customerId });
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
