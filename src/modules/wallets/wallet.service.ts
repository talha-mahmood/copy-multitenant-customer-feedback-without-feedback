import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import {
  ADMIN_WALLET_REPOSITORY,
  MERCHANT_WALLET_REPOSITORY,
  SUPER_ADMIN_WALLET_REPOSITORY,
  WALLET_TRANSACTION_REPOSITORY,
  CREDIT_PACKAGE_REPOSITORY,
} from './wallet.provider';
import { AdminWallet } from './entities/admin-wallet.entity';
import { MerchantWallet } from './entities/merchant-wallet.entity';
import { SuperAdminWallet } from './entities/super-admin-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { CreditPackage } from './entities/credit-package.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreateCreditPackageDto } from './dto/create-credit-package.dto';
import { UpdateCreditPackageDto } from './dto/update-credit-package.dto';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';

@Injectable()
export class WalletService {
  constructor(
    @Inject(ADMIN_WALLET_REPOSITORY)
    private adminWalletRepository: Repository<AdminWallet>,
    @Inject(MERCHANT_WALLET_REPOSITORY)
    private merchantWalletRepository: Repository<MerchantWallet>,
    @Inject(SUPER_ADMIN_WALLET_REPOSITORY)
    private superAdminWalletRepository: Repository<SuperAdminWallet>,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private transactionRepository: Repository<WalletTransaction>,
    @Inject(CREDIT_PACKAGE_REPOSITORY)
    private creditPackageRepository: Repository<CreditPackage>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private systemLogService: SystemLogService,
  ) {}

  /**
   * Create admin wallet when admin is created
   */
  async createAdminWallet(adminId: number, currency = 'MYR'): Promise<AdminWallet> {
    const existingWallet = await this.adminWalletRepository.findOne({
      where: { admin_id: adminId },
    });

    if (existingWallet) {
      return existingWallet;
    }

    // Set subscription expiration to one year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const wallet = this.adminWalletRepository.create({
      admin_id: adminId,
      balance: 0,
      total_earnings: 0,
      total_spent: 0,
      pending_amount: 0,
      currency,
      subscription_type: 'annual',
      subscription_expires_at: oneYearFromNow,
      is_active: true,
    });

    return await this.adminWalletRepository.save(wallet);
  }

  /**
   * Create merchant wallet when merchant is created
   */
  async createMerchantWallet(
    merchantId: number,
    subscriptionType = 'temporary',
    currency = 'MYR',
  ): Promise<MerchantWallet> {
    const existingWallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = this.merchantWalletRepository.create({
      merchant_id: merchantId,
      whatsapp_message_credits: 0,
      paid_ad_credits: 0,
      coupon_credits: 0,
      total_credits_purchased: 0,
      total_credits_used: 0,
      subscription_type: subscriptionType,
      annual_fee_paid: subscriptionType === 'annual',
      currency,
      is_active: true,
    });

    return await this.merchantWalletRepository.save(wallet);
  }

  /**
   * Get admin wallet
   */
  async getAdminWallet(adminId: number): Promise<AdminWallet> {
    const wallet = await this.adminWalletRepository.findOne({
      where: { admin_id: adminId },
      relations: ['admin', 'admin.user'],
    });

    if (!wallet) {
      throw new NotFoundException('Admin wallet not found');
    }

    return wallet;
  }

  /**
   * Get merchant wallet
   */
  async getMerchantWallet(merchantId: number): Promise<MerchantWallet> {
    const wallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
      relations: ['merchant'],
    });

    if (!wallet) {
      throw new NotFoundException('Merchant wallet not found');
    }

    return wallet;
  }

  /**
   * Create super admin wallet when super admin is created
   */
  async createSuperAdminWallet(superAdminId: number, currency = 'USD'): Promise<SuperAdminWallet> {
    const existingWallet = await this.superAdminWalletRepository.findOne({
      where: { super_admin_id: superAdminId },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = this.superAdminWalletRepository.create({
      super_admin_id: superAdminId,
      balance: 0,
      total_earnings: 0,
      total_spent: 0,
      pending_amount: 0,
      currency,
      admin_subscription_fee: 1199.00, // Default admin subscription fee
      is_active: true,
    });

    return await this.superAdminWalletRepository.save(wallet);
  }

  /**
   * Get super admin wallet
   */
  async getSuperAdminWallet(): Promise<SuperAdminWallet> {
    const wallet = await this.superAdminWalletRepository.findOne({
      where: { is_active: true },
      relations: ['superAdmin', 'superAdmin.user'],
    });

    if (!wallet) {
      throw new NotFoundException('Super admin wallet not found');
    }

    return wallet;
  }

  /**
   * Update admin subscription fee (super admin only)
   */
  async updateAdminSubscriptionFee(newFee: number): Promise<SuperAdminWallet> {
    const wallet = await this.getSuperAdminWallet();
    wallet.admin_subscription_fee = newFee;
    return await this.superAdminWalletRepository.save(wallet);
  }

  /**
   * Add credits to admin wallet (commission earnings)
   */
  async creditAdminWallet(
    adminId: number,
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<WalletTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!wallet) {
        throw new NotFoundException('Admin wallet not found');
      }

      const balanceBefore = parseFloat(wallet.balance.toString());
      const newBalance = balanceBefore + amount;

      // Update wallet
      await queryRunner.manager.update(AdminWallet, wallet.id, {
        balance: newBalance,
        total_earnings: parseFloat(wallet.total_earnings.toString()) + amount,
      });

      // Create transaction
      const transaction = queryRunner.manager.create(WalletTransaction, {
        admin_wallet_id: wallet.id,
        type: 'credit',
        amount,
        status: 'completed',
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        balance_before: balanceBefore,
        balance_after: newBalance,
        completed_at: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct from admin wallet (costs)
   */
  async debitAdminWallet(
    adminId: number,
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<WalletTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!wallet) {
        throw new NotFoundException('Admin wallet not found');
      }

      const balanceBefore = parseFloat(wallet.balance.toString());

      if (balanceBefore < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = balanceBefore - amount;

      // Update wallet
      await queryRunner.manager.update(AdminWallet, wallet.id, {
        balance: newBalance,
        total_spent: parseFloat(wallet.total_spent.toString()) + amount,
      });

      // Create transaction
      const transaction = queryRunner.manager.create(WalletTransaction, {
        admin_wallet_id: wallet.id,
        type: 'debit',
        amount,
        status: 'completed',
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        balance_before: balanceBefore,
        balance_after: newBalance,
        completed_at: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add credits to merchant wallet
   */
  async addMerchantCredits(
    merchantId: number,
    credits: number,
    creditType: string, // e.g., "whatsapp message", "paid ads", "coupon"
    amount: number,
    adminId: number,
    description: string,
    metadata?: any,
  ): Promise<{ merchantTransaction: WalletTransaction; adminTransaction: WalletTransaction; commission: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
        relations: ['merchant'],
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      // Get merchant to determine commission rate
      const merchant = await queryRunner.manager.findOne(Merchant, {
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Calculate commission based on merchant type
      // Temporary merchants: 20% commission
      // Annual merchants: 2% commission
      const commissionRate = merchant.merchant_type === 'temporary' ? 0.20 : 0.02;
      const adminCommission = amount * commissionRate;
      const platformAmount = amount - adminCommission;

      // Update merchant credit balance based on credit type
      const updates: any = {
        total_credits_purchased: wallet.total_credits_purchased + credits,
      };

      if (creditType === 'whatsapp message') {
        updates.whatsapp_message_credits = wallet.whatsapp_message_credits + credits;
      } else if (creditType === 'paid ads') {
        updates.paid_ad_credits = wallet.paid_ad_credits + credits;
      } else if (creditType === 'coupon') {
        updates.coupon_credits = wallet.coupon_credits + credits;
      } else {
        // Default to message credits if type is not recognized
        updates.whatsapp_message_credits = wallet.whatsapp_message_credits + credits;
      }

      await queryRunner.manager.update(MerchantWallet, wallet.id, updates);

      // Create merchant transaction
      const merchantTransaction = queryRunner.manager.create(WalletTransaction, {
        merchant_wallet_id: wallet.id,
        type: 'purchase',
        credits,
        credit_type: creditType,
        amount,
        status: 'completed',
        description,
        metadata: metadata ? JSON.stringify({ ...metadata, commission_rate: commissionRate, platform_amount: platformAmount }) : JSON.stringify({ commission_rate: commissionRate, platform_amount: platformAmount }),
        completed_at: new Date(),
      });

      const savedMerchantTransaction = await queryRunner.manager.save(merchantTransaction);

      // Credit admin wallet with commission
      const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!adminWallet) {
        throw new NotFoundException('Admin wallet not found');
      }

      const adminBalanceBefore = parseFloat(adminWallet.balance.toString());
      const newAdminBalance = adminBalanceBefore + adminCommission;

      await queryRunner.manager.update(AdminWallet, adminWallet.id, {
        balance: newAdminBalance,
        total_earnings: parseFloat(adminWallet.total_earnings.toString()) + adminCommission,
      });

      // Create admin transaction
      const adminTransaction = queryRunner.manager.create(WalletTransaction, {
        admin_wallet_id: adminWallet.id,
        type: 'commission',
        amount: adminCommission,
        status: 'completed',
        description: `Commission from merchant credit purchase (${commissionRate * 100}%)`,
        metadata: JSON.stringify({
          merchant_id: merchantId,
          purchase_amount: amount,
          commission_rate: commissionRate,
          credits,
          credit_type: creditType,
        }),
        balance_before: adminBalanceBefore,
        balance_after: newAdminBalance,
        completed_at: new Date(),
      });

      const savedAdminTransaction = await queryRunner.manager.save(adminTransaction);

      await queryRunner.commitTransaction();

      // Log wallet credit addition
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_ADD,
        `Added ${credits} ${creditType} credits to merchant wallet`,
        merchantId,
        'merchant',
        amount,
        {
          merchant_id: merchantId,
          credits,
          credit_type: creditType,
          amount,
          admin_id: adminId,
          commission: adminCommission,
          commission_rate: commissionRate,
        },
      );

      return {
        merchantTransaction: savedMerchantTransaction,
        adminTransaction: savedAdminTransaction,
        commission: adminCommission,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct merchant credits (when sending WhatsApp message)
   */
  async deductMerchantCredits(
    merchantId: number,
    credits: number,
    creditType: 'paid ads' | 'coupon' | 'whatsapp message',
    description: string,
    metadata?: any,
  ): Promise<WalletTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      // Check if sufficient credits
      if (creditType === 'paid ads' && wallet.paid_ad_credits < credits) {
        throw new BadRequestException('Insufficient paid ad credits');
      }

      if (creditType === 'coupon' && wallet.coupon_credits < credits) {
        throw new BadRequestException('Insufficient coupon credits');
      }

      if (creditType === 'whatsapp message' && wallet.whatsapp_message_credits < credits) {
        throw new BadRequestException('Insufficient WhatsApp message credits');
      }

      // Update appropriate credit balance
      const updates: any = {
        whatsapp_message_credits: wallet.whatsapp_message_credits - credits,
        total_credits_used: wallet.total_credits_used + credits,
      };

      if (creditType === 'paid ads') {
        updates.paid_ad_credits = wallet.paid_ad_credits - credits;
      } else if (creditType === 'coupon') {
        updates.coupon_credits = wallet.coupon_credits - credits;
      }

      await queryRunner.manager.update(MerchantWallet, wallet.id, updates);

      // Create transaction
      const transaction = queryRunner.manager.create(WalletTransaction, {
        merchant_wallet_id: wallet.id,
        type: 'debit',
        credits,
        credit_type: creditType,
        status: 'completed',
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        completed_at: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      // Log wallet credit deduction
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_DEDUCT,
        `Deducted ${credits} ${creditType} credits from merchant wallet`,
        merchantId,
        'merchant',
        0,
        {
          merchant_id: merchantId,
          credits,
          credit_type: creditType,
          description,
        },
      );

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get admin wallet transactions
   */
  async getAdminTransactions(adminId: number, page = 1, limit = 20) {
    const wallet = await this.getAdminWallet(adminId);

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { admin_wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get merchant wallet transactions
   */
  async getMerchantTransactions(merchantId: number, page = 1, limit = 20) {
    const wallet = await this.getMerchantWallet(merchantId);

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { merchant_wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all credit packages (managed by super admin)
   */
  async getCreditPackages(merchantType?: string) {
    const query: any = { is_active: true };

    if (merchantType) {
      query.merchant_type = merchantType;
    }

    return await this.creditPackageRepository.find({
      where: query,
      order: { sort_order: 'ASC', price: 'ASC' },
    });
  }

  /**
   * Create a new credit package (super admin only)
   */
  async createCreditPackage(createDto: CreateCreditPackageDto) {
    const creditPackage = this.creditPackageRepository.create({
      name: createDto.name,
      description: createDto.description,
      credits: createDto.credits,
      credit_type: createDto.credit_type,
      price: createDto.price,
      price_per_credit: createDto.price_per_credit,
      currency: createDto.currency || 'USD',
      merchant_type: createDto.merchant_type,
      is_active: createDto.is_active ?? true,
      sort_order: createDto.sort_order ?? 0,
      bonus_credits: createDto.bonus_credits ?? 0,
    });

    const saved = await this.creditPackageRepository.save(creditPackage);

    return {
      message: 'Credit package created successfully',
      data: saved,
    };
  }

  /**
   * Get a single credit package by ID
   */
  async getCreditPackage(id: number) {
    const creditPackage = await this.creditPackageRepository.findOne({
      where: { id },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    return {
      message: 'Credit package retrieved successfully',
      data: creditPackage,
    };
  }

  /**
   * Update a credit package (super admin only)
   */
  async updateCreditPackage(id: number, updateDto: UpdateCreditPackageDto) {
    const creditPackage = await this.creditPackageRepository.findOne({
      where: { id },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    // Update fields
    if (updateDto.name !== undefined) creditPackage.name = updateDto.name;
    if (updateDto.description !== undefined) creditPackage.description = updateDto.description;
    if (updateDto.credits !== undefined) creditPackage.credits = updateDto.credits;
    if (updateDto.credit_type !== undefined) creditPackage.credit_type = updateDto.credit_type;
    if (updateDto.price !== undefined) creditPackage.price = updateDto.price;
    if (updateDto.price_per_credit !== undefined) creditPackage.price_per_credit = updateDto.price_per_credit;
    if (updateDto.currency !== undefined) creditPackage.currency = updateDto.currency;
    if (updateDto.merchant_type !== undefined) creditPackage.merchant_type = updateDto.merchant_type;
    if (updateDto.is_active !== undefined) creditPackage.is_active = updateDto.is_active;
    if (updateDto.sort_order !== undefined) creditPackage.sort_order = updateDto.sort_order;
    if (updateDto.bonus_credits !== undefined) creditPackage.bonus_credits = updateDto.bonus_credits;

    const updated = await this.creditPackageRepository.save(creditPackage);

    return {
      message: 'Credit package updated successfully',
      data: updated,
    };
  }

  /**
   * Delete a credit package (super admin only)
   */
  async deleteCreditPackage(id: number) {
    const creditPackage = await this.creditPackageRepository.findOne({
      where: { id },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    await this.creditPackageRepository.softDelete(id);

    return {
      message: 'Credit package deleted successfully',
    };
  }

  /**
   * Upgrade merchant to annual subscription
   */
  async upgradeToAnnual(merchantId: number, adminId: number) {
    const ANNUAL_FEE = 1199.00; // Predefined annual subscription fee
    const COMMISSION_RATE = 0.75; // 75% commission to admin

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      // Check if already annual
      if (wallet.subscription_type === 'annual') {
        throw new BadRequestException('Merchant is already on annual subscription');
      }

      // Update to annual
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        subscription_type: 'annual',
        annual_fee_paid: true,
        subscription_expires_at: expiresAt,
      });

      // Credit admin wallet with commission
      const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (adminWallet) {
        const commission = ANNUAL_FEE * COMMISSION_RATE; // Agent gets 75% (RM900 of RM1199)
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
          description: `Annual subscription commission from merchant #${merchantId}`,
          metadata: JSON.stringify({ merchant_id: merchantId, total_amount: ANNUAL_FEE }),
          completed_at: new Date(),
        });
      }

      await queryRunner.commitTransaction();

      return { success: true, expires_at: expiresAt, annual_fee: ANNUAL_FEE, commission: ANNUAL_FEE * COMMISSION_RATE };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct WhatsApp message credits from merchant wallet
   */
  async deductWhatsAppCredit(merchantId: number, messageCount: number = 1): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      if (wallet.whatsapp_message_credits < messageCount) {
        throw new BadRequestException('Insufficient WhatsApp message credits');
      }

      // Deduct credits
      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        whatsapp_message_credits: wallet.whatsapp_message_credits - messageCount,
        total_credits_used: wallet.total_credits_used + messageCount,
      });

      // Create transaction record
      await queryRunner.manager.save(WalletTransaction, {
        merchant_wallet_id: wallet.id,
        type: 'credit_usage',
        amount: 0, // No monetary amount, just credit usage
        status: 'completed',
        description: `WhatsApp message sent (${messageCount} credit${messageCount > 1 ? 's' : ''} used)`,
        metadata: JSON.stringify({
          credit_type: 'whatsapp message',
          credits_used: messageCount,
          credits_remaining: wallet.whatsapp_message_credits - messageCount,
        }),
        completed_at: new Date(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct paid ads credits from merchant wallet
   */
  async deductPaidAdCredit(merchantId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      if (wallet.paid_ad_credits < 1) {
        throw new BadRequestException('Insufficient paid ads credits');
      }

      // Deduct 1 credit for paid ad
      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        paid_ad_credits: wallet.paid_ad_credits - 1,
        total_credits_used: wallet.total_credits_used + 1,
      });

      // Create transaction record
      await queryRunner.manager.save(WalletTransaction, {
        merchant_wallet_id: wallet.id,
        type: 'credit_usage',
        amount: 0,
        status: 'completed',
        description: 'Paid ad credit used',
        metadata: JSON.stringify({
          credit_type: 'paid ads',
          credits_used: 1,
          credits_remaining: wallet.paid_ad_credits - 1,
        }),
        completed_at: new Date(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct coupon credits from merchant wallet
   */
  async deductCouponCredits(merchantId: number, couponCount: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(MerchantWallet, {
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new NotFoundException('Merchant wallet not found');
      }

      if (wallet.coupon_credits < couponCount) {
        throw new BadRequestException(
          `Insufficient coupon credits. Required: ${couponCount}, Available: ${wallet.coupon_credits}`,
        );
      }

      // Deduct credits
      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        coupon_credits: wallet.coupon_credits - couponCount,
        total_credits_used: wallet.total_credits_used + couponCount,
      });

      // Create transaction record
      await queryRunner.manager.save(WalletTransaction, {
        merchant_wallet_id: wallet.id,
        type: 'credit_usage',
        amount: 0,
        status: 'completed',
        description: `Coupon batch created (${couponCount} credit${couponCount > 1 ? 's' : ''} used)`,
        metadata: JSON.stringify({
          credit_type: 'coupon',
          credits_used: couponCount,
          credits_remaining: wallet.coupon_credits - couponCount,
        }),
        completed_at: new Date(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check if merchant has sufficient credits
   */
  async checkMerchantCredits(
    merchantId: number,
    creditType: 'whatsapp message' | 'paid ads' | 'coupon',
    requiredCredits: number = 1,
  ): Promise<{ hasCredits: boolean; availableCredits: number }> {
    const wallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (!wallet) {
      return { hasCredits: false, availableCredits: 0 };
    }

    let availableCredits = 0;
    let hasCredits = false;

    switch (creditType) {
      case 'whatsapp message':
        availableCredits = wallet.whatsapp_message_credits;
        hasCredits = wallet.whatsapp_message_credits >= requiredCredits;
        break;
      case 'paid ads':
        availableCredits = wallet.paid_ad_credits;
        hasCredits = wallet.paid_ad_credits >= requiredCredits;
        break;
      case 'coupon':
        availableCredits = wallet.coupon_credits;
        hasCredits = wallet.coupon_credits >= requiredCredits;
        break;
    }

    return { hasCredits, availableCredits };
  }

  /**
   * Process admin subscription payment to super admin
   */
  async processAdminSubscriptionPayment(adminId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get super admin wallet to get the subscription fee
      const superAdminWallet = await this.getSuperAdminWallet();
      const subscriptionFee = parseFloat(superAdminWallet.admin_subscription_fee.toString());

      // Get admin wallet
      const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!adminWallet) {
        throw new NotFoundException('Admin wallet not found');
      }

      // Set subscription expiration to one year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      // Update admin wallet subscription
      await queryRunner.manager.update(AdminWallet, adminWallet.id, {
        subscription_expires_at: oneYearFromNow,
      });

      // Credit super admin wallet
      await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
        balance: parseFloat(superAdminWallet.balance.toString()) + subscriptionFee,
        total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + subscriptionFee,
      });

      // Create transaction for super admin
      await queryRunner.manager.save(WalletTransaction, {
        super_admin_wallet_id: superAdminWallet.id,
        type: 'subscription_fee',
        amount: subscriptionFee,
        status: 'completed',
        description: `Admin subscription payment from admin #${adminId}`,
        metadata: JSON.stringify({ admin_id: adminId }),
        completed_at: new Date(),
      });

      // Log the transaction
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_ADD,
        `Admin subscription fee $${subscriptionFee} received from admin #${adminId}`,
        superAdminWallet.super_admin_id,
        'super_admin',
        subscriptionFee,
        { admin_id: adminId, subscription_expires_at: oneYearFromNow },
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Admin subscription payment processed successfully',
        data: {
          adminId,
          subscriptionFee,
          subscriptionExpiresAt: oneYearFromNow,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
