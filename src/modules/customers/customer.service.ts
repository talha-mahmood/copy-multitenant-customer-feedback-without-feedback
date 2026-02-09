import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';
import { WhatsAppMessageType, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

@Injectable()
export class CustomerService {
  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    const savedCustomer = await this.customerRepository.save(customer);
    return {
      message: 'Customer created successfully',
      data: instanceToPlain(savedCustomer),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '', user?: { role: string; merchantId?: number | null; adminId?: number | null }, isActive?: boolean) {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.merchant', 'merchant');

    if (isActive !== undefined) {
      queryBuilder.where('customer.is_active = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // If admin, filter by admin's merchants
    if (user && user.role === 'admin' && user.adminId) {
      queryBuilder.andWhere('merchant.admin_id = :adminId', { adminId: user.adminId });
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

  async findOne(id: number, user?: { role: string; merchantId?: number | null; adminId?: number | null }) {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: ['merchant'],
    });
    if (!customer) {
      throw new HttpException('Customer not found', 404);
    }
    // If admin, check if customer's merchant belongs to admin
    if (user && user.role === 'admin' && user.adminId && customer.merchant && customer.merchant.admin_id !== user.adminId) {
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

  async checkCustomerByPhone(phone: string) {
    if (!phone?.trim()) {
      throw new HttpException('Phone number is required', 400);
    }

    const normalizedPhone = this.normalizePhone(phone);

    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where(
        `
          REGEXP_REPLACE(customer.phone, '[^0-9]', '', 'g')
          LIKE :phone
        `,
        { phone: `%${normalizedPhone}%` },
      )
      .getOne();

    if (!customer) {
      return {
        message: 'Customer not found',
        data: null,
      };
    }

    return {
      message: 'Customer found',
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        gender: customer.gender,
        date_of_birth: this.formatDate(customer.date_of_birth),
      },
    };
  }

  async claimCoupon(claimCouponDto: ClaimCouponDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate merchant
      const merchant = await this.merchantRepository.findOne({
        where: { id: claimCouponDto.merchant_id },
      });

      if (!merchant) {
        throw new HttpException('Merchant not found', 404);
      }

      // 2. Get the coupon batch
      const batch = await this.couponBatchRepository.findOne({
        where: { id: claimCouponDto.coupon_batch_id },
      });

      if (!batch) {
        throw new HttpException('Coupon batch not found', 404);
      }

      if (!batch.is_active) {
        throw new HttpException('Coupon batch is not active', 400);
      }

      // Verify batch belongs to the merchant
      if (batch.merchant_id !== claimCouponDto.merchant_id) {
        throw new HttpException('Coupon batch does not belong to this merchant', 400);
      }

      // Check if batch has expired
      // const now = new Date();
      // if (new Date(batch.end_date) < now) {
      //   throw new HttpException('Coupon batch has expired', 400);
      // }

      // 3. Check or create customer
      let customer = await queryRunner.manager.findOne(Customer, {
        where: { phone: claimCouponDto.phone },
      });

      let isNewCustomer = false;

      if (!customer) {
        isNewCustomer = true;
        // Create new customer
        const customerData: any = {
          name: claimCouponDto.name,
          phone: claimCouponDto.phone,
          merchant_id: claimCouponDto.merchant_id,
        };

        if (claimCouponDto.date_of_birth) {
          // Parse DD-MM-YYYY format to YYYY-MM-DD for PostgreSQL
          const dateStr = claimCouponDto.date_of_birth.trim();
          const [day, month, year] = dateStr.split('-');
          
          // Validate date parts
          if (day && month && year && year.length === 4) {
            const paddedDay = day.padStart(2, '0');
            const paddedMonth = month.padStart(2, '0');
            customerData.date_of_birth = `${year}-${paddedMonth}-${paddedDay}`;
          } else {
            throw new HttpException('Invalid date format. Expected DD-MM-YYYY', 400);
          }
        }

        const newCustomer = queryRunner.manager.create(Customer, customerData);
        customer = await queryRunner.manager.save(newCustomer);
      } else {
        // Update existing customer if values have changed
        const updates: any = {};
        let hasChanges = false;

        // Compare and update name
        if (claimCouponDto.name && claimCouponDto.name.trim() && claimCouponDto.name !== customer.name) {
          updates.name = claimCouponDto.name.trim();
          hasChanges = true;
        }

        // Compare and update date_of_birth
        if (claimCouponDto.date_of_birth) {
          const dateStr = claimCouponDto.date_of_birth.trim();
          const [day, month, year] = dateStr.split('-');
          
          // Validate date parts
          if (day && month && year && year.length === 4) {
            const paddedDay = day.padStart(2, '0');
            const paddedMonth = month.padStart(2, '0');
            const formattedDate = `${year}-${paddedMonth}-${paddedDay}`;
            
            // Compare with existing date
            const existingDate = customer.date_of_birth 
              ? new Date(customer.date_of_birth).toISOString().split('T')[0] 
              : null;
            
            if (formattedDate !== existingDate) {
              updates.date_of_birth = formattedDate;
              hasChanges = true;
            }
          } else {
            throw new HttpException('Invalid date format. Expected DD-MM-YYYY', 400);
          }
        }

        // Apply updates if there are changes
        if (hasChanges) {
          await queryRunner.manager.update(Customer, customer.id, updates);
          // Reload customer with updates
          customer = await queryRunner.manager.findOne(Customer, {
            where: { id: customer.id },
          });
        }
      }

      // 5. Find an available coupon from the batch
      let coupon = await queryRunner.manager.findOne(Coupon, {
        where: {
          batch_id: batch.id,
          status: 'created',
        },
        order: { created_at: 'ASC' },
      });

      if (!coupon) {
        throw new HttpException('No available coupons in this batch', 404);
      }

      await queryRunner.commitTransaction();

      // 6. Send WhatsApp message
      let whatsappSent = false;

      if (customer?.phone) {
        // Check if merchant has WhatsApp credits
        const creditCheck = await this.walletService.checkMerchantCredits(
          merchant.id,
          'whatsapp_ui',
          1,
        );

        if (!creditCheck.hasCredits) {
          throw new HttpException('Merchant has insufficient WhatsApp credits', 400);
        }

        const expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const message = `Hello ${customer.name}, thank you for visiting ${merchant.business_name}! Here's your coupon code ${coupon.coupon_code} valid until ${expiryDate}. Visit ${merchant.address || 'our location'} to redeem.`;

        try {
          // Send WhatsApp message
          await this.whatsappService.sendWhatsAppMessageWithCredits(
            merchant.id,
            customer.phone,
            message,
            WhatsAppMessageType.USER_INITIATED,
            WhatsAppCampaignType.DIRECT_CLAIM,
            coupon.id,
            customer.id,
          );

          whatsappSent = true;

          // Assign coupon to customer
          const issuedAt = new Date();
          await this.couponRepository.update(coupon.id, {
            customer_id: customer.id,
            status: 'issued',
            issued_at: issuedAt,
            whatsapp_sent: true,
          });

          // Update batch issued quantity
          await this.couponBatchRepository.increment(
            { id: batch.id },
            'issued_quantity',
            1
          );

          // Log successful WhatsApp message
          await this.systemLogService.logWhatsApp(
            SystemLogAction.MESSAGE_SENT,
            `Coupon sent via WhatsApp to ${customer.name}`,
            customer.id,
            {
              customer_id: customer.id,
              merchant_id: merchant.id,
              coupon_code: coupon.coupon_code,
              phone: customer.phone,
              context: 'direct_coupon_claim',
            },
          );

          return {
            message: 'Coupon claimed successfully and sent via WhatsApp',
            data: {
              customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                is_new: isNewCustomer,
              },
              coupon: {
                id: coupon.id,
                batch_name: batch.batch_name,
                expires_at: batch.end_date,
              },
              whatsapp_sent: true,
            },
          };
        } catch (whatsappError) {
          console.error(`WhatsApp send failed for customer ${customer.id}:`, whatsappError.message);
          
          // Log failed WhatsApp message
          await this.systemLogService.logWhatsApp(
            SystemLogAction.MESSAGE_FAILED,
            `Failed to send coupon via WhatsApp to ${customer.name}`,
            customer.id,
            {
              customer_id: customer.id,
              merchant_id: merchant.id,
              phone: customer.phone,
              error: whatsappError.message,
              context: 'direct_coupon_claim',
            },
          );

          throw new HttpException('Failed to send coupon via WhatsApp', 500);
        }
      } else {
        throw new HttpException('Customer phone number is required for WhatsApp delivery', 400);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }
}
