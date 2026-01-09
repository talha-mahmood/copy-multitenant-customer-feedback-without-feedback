import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    const savedCustomer = await this.customerRepository.save(customer);
    return {
      message: 'Customer created successfully',
      data: instanceToPlain(savedCustomer),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '', user?: { role: string; merchantId?: number | null }, isActive?: boolean) {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer');

    if (isActive !== undefined) {
      queryBuilder.where('customer.is_active = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // If merchant, filter by merchantId
    if (user && user.role === 'merchant' && user.merchantId) {
      queryBuilder.andWhere('customer.merchant_id = :merchantId', { merchantId: user.merchantId });
    }

    queryBuilder
      .orderBy('customer.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [customers, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(customers),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number, user?: { role: string; merchantId?: number | null }) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    // If merchant, restrict to own customers
    if (user && user.role === 'merchant' && user.merchantId && customer.merchant_id !== user.merchantId) {
      throw new HttpException('Customer not found', 404);
    }
    return {
      message: 'Success fetching customer',
      data: instanceToPlain(customer),
    };
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }

    await this.customerRepository.update(id, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.findOne({ where: { id } });
    
    return {
      message: 'Customer updated successfully',
      data: instanceToPlain(updatedCustomer),
    };
  }

  async remove(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    await this.customerRepository.softDelete(id);
    return {
      message: 'Customer deleted successfully',
    };
  }
}
