import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import {
  ADMIN_WALLET_REPOSITORY,
  MERCHANT_WALLET_REPOSITORY,
  WALLET_TRANSACTION_REPOSITORY,
  CREDIT_PACKAGE_REPOSITORY,
} from './wallet.provider';
import { AdminWallet } from './entities/admin-wallet.entity';
import { MerchantWallet } from './entities/merchant-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { CreditPackage } from './entities/credit-package.entity';

@Injectable()
export class WalletService {
  constructor(
    @Inject(ADMIN_WALLET_REPOSITORY)
    private adminWalletRepository: Repository<AdminWallet>,
    @Inject(MERCHANT_WALLET_REPOSITORY)
    private merchantWalletRepository: Repository<MerchantWallet>,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private transactionRepository: Repository<WalletTransaction>,
    @Inject(CREDIT_PACKAGE_REPOSITORY)
    private creditPackageRepository: Repository<CreditPackage>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
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

    const wallet = this.adminWalletRepository.create({
      admin_id: adminId,
      balance: 0,
      total_earnings: 0,
      total_spent: 0,
      pending_amount: 0,
      currency,
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
      message_credits: 0,
      marketing_credits: 0,
      utility_credits: 0,
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
      relations: ['admin'],
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
    creditType: 'marketing' | 'utility' | 'general',
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
      const merchant = await queryRunner.manager.findOne('Merchant', {
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Calculate commission based on merchant type
      // Temporary merchants: 20% commission
      // Annual merchants: 10% commission
      const commissionRate = merchant.merchant_type === 'temporary' ? 0.20 : 0.10;
      const adminCommission = amount * commissionRate;
      const platformAmount = amount - adminCommission;

      // Update merchant credit balance
      const updates: any = {
        message_credits: wallet.message_credits + credits,
        total_credits_purchased: wallet.total_credits_purchased + credits,
      };

      if (creditType === 'marketing') {
        updates.marketing_credits = wallet.marketing_credits + credits;
      } else if (creditType === 'utility') {
        updates.utility_credits = wallet.utility_credits + credits;
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
    creditType: 'marketing' | 'utility' | 'general',
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
      if (creditType === 'marketing' && wallet.marketing_credits < credits) {
        throw new BadRequestException('Insufficient marketing credits');
      }

      if (creditType === 'utility' && wallet.utility_credits < credits) {
        throw new BadRequestException('Insufficient utility credits');
      }

      if (creditType === 'general' && wallet.message_credits < credits) {
        throw new BadRequestException('Insufficient credits');
      }

      // Update appropriate credit balance
      const updates: any = {
        message_credits: wallet.message_credits - credits,
        total_credits_used: wallet.total_credits_used + credits,
      };

      if (creditType === 'marketing') {
        updates.marketing_credits = wallet.marketing_credits - credits;
      } else if (creditType === 'utility') {
        updates.utility_credits = wallet.utility_credits - credits;
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
   * Get all credit packages
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
   * Upgrade merchant to annual subscription
   */
  async upgradeToAnnual(merchantId: number, amount: number, adminId: number) {
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
        const commission = amount * 0.75; // Agent gets 75% (RM900 of RM1199)
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
          metadata: JSON.stringify({ merchant_id: merchantId, total_amount: amount }),
          completed_at: new Date(),
        });
      }

      await queryRunner.commitTransaction();

      return { success: true, expires_at: expiresAt };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
