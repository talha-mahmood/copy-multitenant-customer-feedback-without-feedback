import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import * as bcrypt from 'bcrypt';
import { QRCodeHelper } from 'src/common/helpers/qrcode.helper';
import { WalletService } from '../wallets/wallet.service';
import { AdminWallet } from '../wallets/entities/admin-wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';

@Injectable()
export class MerchantService {
  constructor(
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('ROLE_REPOSITORY')
    private roleRepository: Repository<Role>,
    @Inject('USER_HAS_ROLE_REPOSITORY')
    private userHasRoleRepository: Repository<UserHasRole>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private walletService: WalletService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createMerchantDto.email },
      });
      if (existingUser) {
        throw new HttpException('User with this email already exists', 400);
      }

      // Find role by name
      const role = await this.roleRepository.findOne({
        where: { name: createMerchantDto.role },
      });
      if (!role) {
        throw new HttpException('Role not found', 404);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createMerchantDto.password, 10);

      // Create user
      const user = queryRunner.manager.create(User, {
        name: createMerchantDto.name,
        email: createMerchantDto.email,
        password: hashedPassword,
        phone: '', // Optional, can be added to DTO if needed
        avatar: '',
        is_active: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Assign role to user
      const userHasRole = queryRunner.manager.create(UserHasRole, {
        user_id: savedUser.id,
        role_id: role.id,
      });
      await queryRunner.manager.save(userHasRole);

      // Create merchant
      const merchant = queryRunner.manager.create(Merchant, {
        user_id: savedUser.id,
        address: createMerchantDto.address,
        business_name: createMerchantDto.business_name,
        business_type: createMerchantDto.business_type,
        merchant_type: createMerchantDto.merchant_type,
        tax_id: createMerchantDto.tax_id,
      });
      const savedMerchant = await queryRunner.manager.save(merchant);

      // Generate QR code automatically
      const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3000';
      const secret = process.env.APP_KEY || 'default-secret';
      
      const hash = require('crypto')
        .createHmac('sha256', secret)
        .update(`merchant:${savedMerchant.id}`)
        .digest('hex')
        .substring(0, 16);
      
      const qrCodeUrl = `${baseUrl}/feedback?mid=${savedMerchant.id}&hash=${hash}`;
      const qrCodeImage = await QRCodeHelper.generateQRCodeImage(qrCodeUrl);
      
      // Update merchant with QR code info
      await queryRunner.manager.update(Merchant, savedMerchant.id, {
        qr_code_url: qrCodeUrl,
        qr_code_hash: hash,
        qr_code_image: qrCodeImage,
      });

      // Create merchant wallet within the transaction
      const merchantType = createMerchantDto.merchant_type || 'temporary';
      const isAnnual = merchantType === 'annual';
      
      const expiresAt = isAnnual ? new Date() : null;
      if (expiresAt) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      const merchantWallet = queryRunner.manager.create('MerchantWallet', {
        merchant_id: savedMerchant.id,
        message_credits: 0,
        marketing_credits: 0,
        utility_credits: 0,
        total_credits_purchased: 0,
        total_credits_used: 0,
        subscription_type: merchantType,
        annual_fee_paid: isAnnual,
        subscription_expires_at: expiresAt,
        currency: 'USD',
        is_active: true,
      });
      await queryRunner.manager.save(merchantWallet);

      // If annual merchant, credit admin wallet with commission
      if (isAnnual && createMerchantDto.admin_id) {
        const ANNUAL_FEE = 1199.00;
        const COMMISSION_RATE = 0.75;
        const commission = ANNUAL_FEE * COMMISSION_RATE;

        const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
          where: { admin_id: createMerchantDto.admin_id },
        });

        if (adminWallet) {
          await queryRunner.manager.update(AdminWallet, adminWallet.id, {
            balance: parseFloat(adminWallet.balance.toString()) + commission,
            total_earnings: parseFloat(adminWallet.total_earnings.toString()) + commission,
          });

          // Create admin transaction
          await queryRunner.manager.save(WalletTransaction, {
            admin_wallet_id: adminWallet.id,
            type: 'commission',
            amount: commission,
            status: 'completed',
            description: `Annual subscription commission from new merchant #${savedMerchant.id}`,
            metadata: JSON.stringify({ merchant_id: savedMerchant.id, total_amount: ANNUAL_FEE }),
            completed_at: new Date(),
          });
        }
      }
      
      await queryRunner.commitTransaction();

      // Load the merchant with user relation
      const merchantWithUser = await this.merchantRepository.findOne({
        where: { id: savedMerchant.id },
        relations: ['user'],
      });

      return {
        message: 'Merchant created successfully',
        data: instanceToPlain(merchantWithUser),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create merchant',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.merchantRepository
      .createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search OR merchant.business_name ILIKE :search)',
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
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
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

    await this.merchantRepository.update(id, updateMerchantDto);
    const updatedMerchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
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

  async getQRCode(id: number) {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }

    // If QR code not generated yet, generate it
    if (!merchant.qr_code_url || !merchant.qr_code_hash || !merchant.qr_code_image) {
      return this.generateQRCode(id);
    }

    return {
      message: 'Success fetching QR code',
      data: {
        merchantId: merchant.id,
        businessName: merchant.business_name,
        qrCodeUrl: merchant.qr_code_url,
        qrCodeHash: merchant.qr_code_hash,
        qrCodeImage: merchant.qr_code_image,
      },
    };
  }

  async generateQRCode(id: number) {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }

    const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3000';
    const secret = process.env.APP_KEY || 'default-secret';
    
    // Generate hash using merchant ID only
    const hash = require('crypto')
      .createHmac('sha256', secret)
      .update(`merchant:${id}`)
      .digest('hex')
      .substring(0, 16);
    
    const qrCodeUrl = `${baseUrl}/feedback?mid=${id}&hash=${hash}`;
    
    // Generate base64 QR code image
    const qrCodeImage = await QRCodeHelper.generateQRCodeImage(qrCodeUrl);
    
    // Update merchant with QR code info
    await this.merchantRepository.update(id, {
      qr_code_url: qrCodeUrl,
      qr_code_hash: hash,
      qr_code_image: qrCodeImage,
    });

    return {
      message: 'QR code generated successfully',
      data: {
        merchantId: id,
        businessName: merchant.business_name,
        qrCodeUrl: qrCodeUrl,
        qrCodeHash: hash,
        qrCodeImage: qrCodeImage,
      },
    };
  }
}
