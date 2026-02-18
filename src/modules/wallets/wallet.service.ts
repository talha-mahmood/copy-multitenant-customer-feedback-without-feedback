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
  CREDITS_LEDGER_REPOSITORY,
} from './wallet.provider';
import { AdminWallet } from './entities/admin-wallet.entity';
import { MerchantWallet } from './entities/merchant-wallet.entity';
import { SuperAdminWallet } from './entities/super-admin-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { CreditPackage } from './entities/credit-package.entity';
import { CreditsLedger } from './entities/credits-ledger.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreateCreditPackageDto } from './dto/create-credit-package.dto';
import { UpdateCreditPackageDto } from './dto/update-credit-package.dto';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';
import { SuperAdminSettingsService } from '../super-admin-settings/super-admin-settings.service';
import { CreditLedgerService } from '../credits-ledger/credit-ledger.service';
import { th } from '@faker-js/faker/.';

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
    @Inject(CREDITS_LEDGER_REPOSITORY)
    private creditsLedgerRepository: Repository<CreditsLedger>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private systemLogService: SystemLogService,
    private superAdminSettingsService: SuperAdminSettingsService,
    private creditLedgerService: CreditLedgerService,
  ) { }

  /**
   * Create admin wallet when admin is created
   */
  async createAdminWallet(adminId: number, currency = 'USD'): Promise<AdminWallet> {
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
      is_active: false, // New agents start with inactive subscription
    });

    return await this.adminWalletRepository.save(wallet);
  }

  /**
   * Create merchant wallet when merchant is created
   */
  async createMerchantWallet(
    merchantId: number,
    subscriptionType = 'temporary',
    currency = 'USD',
  ): Promise<MerchantWallet> {
    const existingWallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = this.merchantWalletRepository.create({
      merchant_id: merchantId,
      whatsapp_ui_credits: 0,
      whatsapp_bi_credits: 0,
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

    // Auto-downgrade if expired
    // if (
    //   wallet.subscription_type === 'annual' &&
    //   wallet.subscription_expires_at &&
    //   wallet.subscription_expires_at < new Date()
    // ) {
    //   wallet.subscription_type = 'temporary';
    //   wallet.is_subscription_expired = true;
    //   await this.merchantWalletRepository.save(wallet);

    //   if (wallet.merchant) {
    //     wallet.merchant.merchant_type = 'temporary';
    //     await this.dataSource.getRepository(Merchant).save(wallet.merchant);
    //   }
    //   console.log(`Merchant ${merchantId} subscription auto-downgraded in getMerchantWallet.`);
    // } 
    // else if (
    //   wallet.subscription_expires_at &&
    //   wallet.subscription_expires_at < new Date() &&
    //   !wallet.is_subscription_expired
    // ) {
    //   wallet.is_subscription_expired = true;
    //   await this.merchantWalletRepository.save(wallet);
    // }

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

      // Update wallet - only update balance, not earnings (top-up is not commission income)
      await queryRunner.manager.update(AdminWallet, wallet.id, {
        balance: newBalance,
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
   * Calculate platform cost based on credit type and merchant type
   */
  private async calculatePlatformCost(
    creditType: string,
    merchantType: string,
    credits: number,
  ): Promise<number> {
    // Fetch platform cost settings
    const settings = await this.superAdminSettingsService.getSettings();

    let costPerCredit = 0;

    // Determine cost per credit based on credit type and merchant type
    if (creditType === 'whatsapp ui message') {
      costPerCredit = merchantType === 'annual'
        ? parseFloat(settings.whatsapp_ui_annual_platform_cost.toString())
        : parseFloat(settings.whatsapp_ui_temporary_platform_cost.toString());
    } else if (creditType === 'whatsapp bi message') {
      // BI messages only for annual merchants
      costPerCredit = parseFloat(settings.whatsapp_bi_platform_cost.toString());
    } else if (creditType === 'coupon') {
      costPerCredit = merchantType === 'annual'
        ? parseFloat(settings.coupon_annual_platform_cost.toString())
        : parseFloat(settings.coupon_temporary_platform_cost.toString());
    } else if (creditType === 'paid ads') {
      // Paid ads do NOT deduct from agent wallet
      return 0;
    }

    const platformCost = credits * costPerCredit;

    console.log('Calculating Platform Cost:', {
      creditType,
      merchantType,
      credits,
      whatsapp_ui_annual_platform_cost: settings.whatsapp_ui_annual_platform_cost,
      whatsapp_ui_temporary_platform_cost: settings.whatsapp_ui_temporary_platform_cost,
      calculatedCost: platformCost,
    });

    return platformCost;
  }

  /**
   * Add credits to merchant wallet
   * NEW MODEL: Deduct platform cost from agent prepaid wallet
   */
  async addMerchantCredits(
    merchantId: number,
    packageId: number,
    credits: number,
    creditType: string, // e.g., "whatsapp ui message", "whatsapp bi message", "paid ads", "coupon"
    amount: number,
    adminId: number,
    description: string,
    metadata?: any,
  ): Promise<{ merchantTransaction: WalletTransaction; agentDeductionTransaction?: WalletTransaction; platformCost: number }> {
    // Validate credit type
    const validCreditTypes = ['whatsapp ui message', 'whatsapp bi message', 'paid ads', 'coupon'];
    if (!validCreditTypes.includes(creditType)) {
      throw new BadRequestException(
        `Invalid credit type: "${creditType}". Valid types are: ${validCreditTypes.join(', ')}`
      );
    }

    // Verify credit package exists and is active
    const creditPackage = await this.creditPackageRepository.findOne({
      where: { id: packageId },
    });

    if (!creditPackage) {
      throw new NotFoundException(
        `Credit package with ID ${packageId} not found. Please select a valid credit package.`
      );
    }

    if (!creditPackage.is_active) {
      throw new BadRequestException(
        `Credit package "${creditPackage.name}" is not active and cannot be purchased.`
      );
    }

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

      // Get merchant to determine platform cost
      const merchant = await queryRunner.manager.findOne(Merchant, {
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Verify package is compatible with merchant type
      if (creditPackage.merchant_type &&
        creditPackage.merchant_type !== 'all' &&
        creditPackage.merchant_type !== merchant.merchant_type) {
        throw new BadRequestException(
          `Credit package "${creditPackage.name}" is only available for ${creditPackage.merchant_type} merchants. Your merchant type is ${merchant.merchant_type}.`
        );
      }

      // Verify package credit type matches requested credit type
      if (creditPackage.credit_type !== creditType) {
        throw new BadRequestException(
          `Credit package type mismatch. Package "${creditPackage.name}" is for "${creditPackage.credit_type}" but you requested "${creditType}".`
        );
      }

      // Temporary merchants CANNOT purchase WhatsApp BI message credits
      if (merchant.merchant_type === 'temporary' && creditType === 'whatsapp bi message') {
        throw new BadRequestException(
          'Temporary merchants cannot purchase WhatsApp BI (Business-Initiated) message credits. Only annual merchants can access automated campaign features. Please upgrade to annual subscription.'
        );
      }

      // Calculate platform cost (prepaid wallet deduction model)
      const platformCost = await this.calculatePlatformCost(creditType, merchant.merchant_type, credits);

      let agentDeductionTransaction: WalletTransaction | undefined;

      // Get agent wallet
      const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!adminWallet) {
        throw new NotFoundException('Agent wallet not found');
      }

      const currentBalance = parseFloat(adminWallet.balance.toString());

      // Handle paid ads (agent gets 100% revenue, no platform cost)
      if (creditType === 'paid ads') {
        // For paid ads, agent gets the full amount as revenue (no platform cost)
        // Update agent wallet earnings
        await queryRunner.manager.update(AdminWallet, adminWallet.id, {
          total_earnings: parseFloat(adminWallet.total_earnings.toString()) + amount,
        });

        // Create commission transaction
        agentDeductionTransaction = queryRunner.manager.create(WalletTransaction, {
          admin_wallet_id: adminWallet.id,
          type: 'merchant_package_commission',
          amount: amount, // Full amount goes to agent
          status: 'completed',
          description: `Revenue from merchant #${merchantId} ${creditType} package purchase (Full amount: ${amount.toFixed(2)}, No platform cost)`,
          metadata: JSON.stringify({
            merchant_id: merchantId,
            package_id: creditPackage.id,
            package_name: creditPackage.name,
            credits,
            credit_type: creditType,
            merchant_payment: amount,
            platform_cost_deducted: 0,
            agent_profit: amount,
          }),
          balance_before: currentBalance,
          balance_after: currentBalance, // Balance unchanged since no deduction
          completed_at: new Date(),
        });

        const savedAgentTransaction = await queryRunner.manager.save(agentDeductionTransaction);
        agentDeductionTransaction = savedAgentTransaction;
      } 
      // Handle other credit types (deduct platform cost from agent wallet)
      else if (platformCost > 0) {
        // Check if agent has sufficient balance
        if (currentBalance < platformCost) {
          throw new BadRequestException(
            `Insufficient agent wallet balance. Required: ${platformCost.toFixed(2)}, Available: ${currentBalance.toFixed(2)}. Please top up your wallet to complete this purchase.`,
          );
        }

        // Deduct platform cost from agent wallet
        const newAgentBalance = currentBalance - platformCost;

        // Calculate agent profit (commission earned)
        const agentProfit = amount - platformCost;

        await queryRunner.manager.update(AdminWallet, adminWallet.id, {
          balance: newAgentBalance,
          total_spent: parseFloat(adminWallet.total_spent.toString()) + platformCost,
          total_earnings: parseFloat(adminWallet.total_earnings.toString()) + agentProfit,
        });

        // Create agent transaction (recording profit, not deduction)
        agentDeductionTransaction = queryRunner.manager.create(WalletTransaction, {
          admin_wallet_id: adminWallet.id,
          type: 'merchant_package_commission',
          amount: agentProfit,
          status: 'completed',
          description: `Profit from merchant #${merchantId} ${creditType} package purchase (Merchant paid: ${amount.toFixed(2)}, Platform cost: ${platformCost.toFixed(2)})`,
          metadata: JSON.stringify({
            merchant_id: merchantId,
            package_id: creditPackage.id,
            package_name: creditPackage.name,
            credits,
            credit_type: creditType,
            merchant_payment: amount,
            platform_cost_deducted: platformCost,
            agent_profit: agentProfit,
          }),
          balance_before: currentBalance,
          balance_after: newAgentBalance,
          completed_at: new Date(),
        });

        const savedAgentTransaction = await queryRunner.manager.save(agentDeductionTransaction);
        agentDeductionTransaction = savedAgentTransaction;

        // Credit super admin wallet with platform cost
        const superAdminWallet = await queryRunner.manager.findOne(SuperAdminWallet, {
          where: { is_active: true },
        });

        if (superAdminWallet) {
          const superAdminBalanceBefore = parseFloat(superAdminWallet.balance.toString());
          const newSuperAdminBalance = superAdminBalanceBefore + platformCost;

          // Determine which field to update based on credit type
          let commissionField = 'commission_annual_merchant_packages';
          if (creditType === 'whatsapp ui message' || creditType === 'whatsapp bi message') {
            commissionField = merchant.merchant_type === 'annual'
              ? 'commission_annual_merchant_packages'
              : 'commission_temporary_merchant_packages';
          } else if (creditType === 'coupon') {
            commissionField = merchant.merchant_type === 'annual'
              ? 'commission_annual_merchant_packages'
              : 'commission_temporary_merchant_packages';
          }

          await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
            balance: newSuperAdminBalance,
            total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + platformCost,
            [commissionField]: parseFloat(superAdminWallet[commissionField].toString()) + platformCost,
          });

          // Create super admin transaction (platform cost)
          await queryRunner.manager.save(WalletTransaction, {
            super_admin_wallet_id: superAdminWallet.id,
            type: 'merchant_package_commission',
            amount: platformCost,
            status: 'completed',
            description: `Platform cost from agent #${adminId} for merchant #${merchantId} ${creditType} purchase`,
            metadata: JSON.stringify({
              merchant_id: merchantId,
              admin_id: adminId,
              package_id: creditPackage.id,
              package_name: creditPackage.name,
              credits,
              credit_type: creditType,
              platform_cost: platformCost,
              merchant_payment: amount,
              agent_profit: amount - platformCost,
            }),
            balance_before: superAdminBalanceBefore,
            balance_after: newSuperAdminBalance,
            completed_at: new Date(),
          });
        }
      }

      // Update merchant credit balance based on credit type
      const updates: any = {
        total_credits_purchased: wallet.total_credits_purchased + credits,
      };

      if (creditType === 'whatsapp ui message') {
        updates.whatsapp_ui_credits = wallet.whatsapp_ui_credits + credits;
      } else if (creditType === 'whatsapp bi message') {
        updates.whatsapp_bi_credits = wallet.whatsapp_bi_credits + credits;
      } else if (creditType === 'paid ads') {
        updates.paid_ad_credits = wallet.paid_ad_credits + credits;
      } else if (creditType === 'coupon') {
        updates.coupon_credits = wallet.coupon_credits + credits;
      } else {
        // Default to UI credits if type is not recognized
        updates.whatsapp_ui_credits = wallet.whatsapp_ui_credits + credits;
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
        metadata: metadata ? JSON.stringify({
          ...metadata,
          platform_cost: platformCost,
          package_id: creditPackage.id,
          package_name: creditPackage.name,
        }) : JSON.stringify({
          platform_cost: platformCost,
          package_id: creditPackage.id,
          package_name: creditPackage.name,
        }),
        completed_at: new Date(),
      });

      const savedMerchantTransaction = await queryRunner.manager.save(merchantTransaction);

      await queryRunner.commitTransaction();

      // Create ledger entry for merchant credit purchase
      const creditTypeMap = {
        'whatsapp ui message': 'wa_ui',
        'whatsapp bi message': 'wa_bi',
        'paid ads': 'paid_ads',
        'coupon': 'coupon',
      };

      await this.creditLedgerService.create({
        owner_type: 'merchant',
        owner_id: merchantId,
        credit_type: creditTypeMap[creditType as keyof typeof creditTypeMap] || 'coupon',
        action: 'purchase',
        amount: credits,
        balance_after: updates.whatsapp_ui_credits || updates.whatsapp_bi_credits || updates.paid_ad_credits || updates.coupon_credits,
        related_object_type: 'package',
        related_object_id: packageId,
        description: `Purchased ${credits} ${creditType} credits from package "${creditPackage.name}"`,
        metadata: {
          package_id: creditPackage.id,
          package_name: creditPackage.name,
          amount,
          admin_id: adminId,
          platform_cost: platformCost,
        },
      });

      // Log wallet credit addition
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_ADD,
        `Added ${credits} ${creditType} credits to merchant wallet from package "${creditPackage.name}"`,
        merchantId,
        'merchant',
        amount,
        {
          merchant_id: merchantId,
          credits,
          credit_type: creditType,
          amount,
          admin_id: adminId,
          platform_cost: platformCost,
          agent_profit: amount - platformCost,
          package_id: creditPackage.id,
          package_name: creditPackage.name,
        },
      );

      return {
        merchantTransaction: savedMerchantTransaction,
        agentDeductionTransaction,
        platformCost,
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
    creditType: 'paid ads' | 'coupon' | 'whatsapp ui message' | 'whatsapp bi message',
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

      if (creditType === 'whatsapp ui message' && wallet.whatsapp_ui_credits < credits) {
        throw new BadRequestException('Insufficient WhatsApp UI message credits');
      } else if (creditType === 'whatsapp bi message' && wallet.whatsapp_bi_credits < credits) {
        throw new BadRequestException('Insufficient WhatsApp BI message credits');
      }

      // Update appropriate credit balance
      const updates: any = {
        total_credits_used: wallet.total_credits_used + credits,
      };

      if (creditType === 'whatsapp ui message') {
        updates.whatsapp_ui_credits = wallet.whatsapp_ui_credits - credits;
      } else if (creditType === 'whatsapp bi message') {
        updates.whatsapp_bi_credits = wallet.whatsapp_bi_credits - credits;
      } else if (creditType === 'paid ads') {
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

      // Create ledger entry for credit deduction
      const creditTypeMap = {
        'whatsapp ui message': 'wa_ui',
        'whatsapp bi message': 'wa_bi',
        'paid ads': 'paid_ads',
        'coupon': 'coupon',
      };

      const balanceAfter = creditType === 'whatsapp ui message' ? updates.whatsapp_ui_credits :
        creditType === 'whatsapp bi message' ? updates.whatsapp_bi_credits :
          creditType === 'paid ads' ? updates.paid_ad_credits :
            updates.coupon_credits;

      await this.creditLedgerService.create({
        owner_type: 'merchant',
        owner_id: merchantId,
        credit_type: creditTypeMap[creditType as keyof typeof creditTypeMap] || 'coupon',
        action: 'deduct',
        amount: -credits, // Negative for deduction
        balance_after: balanceAfter,
        related_object_type: metadata?.related_object_type,
        related_object_id: metadata?.related_object_id,
        description,
        metadata,
      });

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
   * Temporary merchants cannot see WhatsApp BI packages
   */
  async getCreditPackages(merchantType?: string) {
    const query: any = { is_active: true };

    if (merchantType) {
      query.merchant_type = merchantType;
    }

    const packages = await this.creditPackageRepository.find({
      where: query,
      order: { sort_order: 'ASC', price: 'ASC' },
    });

    // Filter out WhatsApp BI packages for temporary merchants
    if (merchantType === 'temporary') {
      return packages.filter(pkg => pkg.credit_type !== 'whatsapp bi message');
    }

    return packages;
  }

  /**
   * Create a new credit package (super admin only)
   */
  async createCreditPackage(createDto: CreateCreditPackageDto) {
    // Validate: WhatsApp BI packages cannot be created for temporary merchants
    if (createDto.credit_type === 'whatsapp bi message' && createDto.merchant_type === 'temporary') {
      throw new BadRequestException(
        'WhatsApp BI (Business-Initiated) message packages cannot be created for temporary merchants.'
      );
    }

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

    // Validate: WhatsApp BI packages cannot be for temporary merchants
    if (creditPackage.credit_type === 'whatsapp bi message' && creditPackage.merchant_type === 'temporary') {
      throw new BadRequestException(
        'WhatsApp BI (Business-Initiated) message packages cannot be assigned to temporary merchants.'
      );
    }

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
    // Get fees and platform cost from settings
    const settings = await this.superAdminSettingsService.getSettings();
    const ANNUAL_FEE = parseFloat(settings.merchant_annual_fee.toString());
    const PLATFORM_COST = parseFloat(settings.merchant_annual_platform_cost.toString());

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

      // Check agent wallet balance
      const adminWallet = await queryRunner.manager.findOne(AdminWallet, {
        where: { admin_id: adminId },
      });

      if (!adminWallet) {
        throw new NotFoundException('Agent wallet not found');
      }

      const currentBalance = parseFloat(adminWallet.balance.toString());
      if (currentBalance < PLATFORM_COST) {
        throw new BadRequestException(
          `Insufficient agent wallet balance. Required: ${PLATFORM_COST.toFixed(2)}, Available: ${currentBalance.toFixed(2)}. Please top up your wallet to upgrade merchant to annual.`,
        );
      }

      // Update to annual
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        subscription_type: 'annual',
        annual_fee_paid: true,
        subscription_expires_at: expiresAt,
      });

      // Update merchant table
      await queryRunner.manager.update(Merchant, { id: merchantId }, {
        merchant_type: 'annual',
      });

      // Deduct platform cost from agent wallet
      const agentBalanceBefore = currentBalance;
      const newAgentBalance = agentBalanceBefore - PLATFORM_COST;
      const agentProfit = ANNUAL_FEE - PLATFORM_COST;

      await queryRunner.manager.update(AdminWallet, adminWallet.id, {
        balance: newAgentBalance,
        total_earnings: parseFloat(adminWallet.total_earnings.toString()) + agentProfit,
      });

      // Create agent transaction
      await queryRunner.manager.save(WalletTransaction, {
        admin_wallet_id: adminWallet.id,
        type: 'merchant_annual_subscription_commission',
        amount: agentProfit,
        status: 'completed',
        description: `Profit from merchant #${merchantId} annual upgrade (Merchant paid: ${ANNUAL_FEE.toFixed(2)}, Platform cost: ${PLATFORM_COST.toFixed(2)})`,
        metadata: JSON.stringify({
          merchant_id: merchantId,
          merchant_payment: ANNUAL_FEE,
          platform_cost_deducted: PLATFORM_COST,
          agent_profit: agentProfit,
          fee_type: 'annual_upgrade',
        }),
        balance_before: agentBalanceBefore,
        balance_after: newAgentBalance,
        completed_at: new Date(),
      });

      // Credit super admin wallet with platform cost
      const superAdminWallet = await queryRunner.manager.findOne(SuperAdminWallet, {
        where: { is_active: true },
      });

      if (superAdminWallet) {
        const superAdminBalanceBefore = parseFloat(superAdminWallet.balance.toString());
        const newSuperAdminBalance = superAdminBalanceBefore + PLATFORM_COST;

        await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
          balance: newSuperAdminBalance,
          total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + PLATFORM_COST,
          commission_merchant_annual_fee: parseFloat(superAdminWallet.commission_merchant_annual_fee.toString()) + PLATFORM_COST,
        });

        // Create super admin transaction
        await queryRunner.manager.save(WalletTransaction, {
          super_admin_wallet_id: superAdminWallet.id,
          type: 'merchant_annual_subscription_commission',
          amount: PLATFORM_COST,
          status: 'completed',
          description: `Platform cost from agent #${adminId} for merchant #${merchantId} annual upgrade`,
          metadata: JSON.stringify({
            merchant_id: merchantId,
            admin_id: adminId,
            platform_cost: PLATFORM_COST,
            merchant_payment: ANNUAL_FEE,
            agent_profit: agentProfit,
            fee_type: 'annual_upgrade',
          }),
          balance_before: superAdminBalanceBefore,
          balance_after: newSuperAdminBalance,
          completed_at: new Date(),
        });
      }

      await queryRunner.commitTransaction();

      return { success: true, expires_at: expiresAt, annual_fee: ANNUAL_FEE, agent_profit: agentProfit, platform_cost: PLATFORM_COST };
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

      if (wallet.whatsapp_ui_credits < messageCount) {
        throw new BadRequestException('Insufficient WhatsApp UI message credits');
      }

      // Deduct credits
      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        whatsapp_ui_credits: wallet.whatsapp_ui_credits - messageCount,
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
          credit_type: 'whatsapp_ui',
          credits_used: messageCount,
          credits_remaining: wallet.whatsapp_ui_credits - messageCount,
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
      const newCouponCredits = wallet.coupon_credits - couponCount;
      await queryRunner.manager.update(MerchantWallet, wallet.id, {
        coupon_credits: newCouponCredits,
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
          credits_remaining: newCouponCredits,
        }),
        completed_at: new Date(),
      });

      await queryRunner.commitTransaction();

      // Create ledger entry for coupon credit deduction
      await this.creditLedgerService.create({
        owner_type: 'merchant',
        owner_id: merchantId,
        credit_type: 'coupon',
        action: 'deduct',
        amount: -couponCount,
        balance_after: newCouponCredits,
        related_object_type: 'coupon_batch',
        related_object_id: undefined, // Will be set by coupon batch service if needed
        description: `Deducted ${couponCount} coupon credits for batch generation`,
        metadata: {
          credits_used: couponCount,
          credits_remaining: newCouponCredits,
        },
      });
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
    creditType: 'whatsapp_ui' | 'whatsapp_bi' | 'paid ads' | 'coupon',
    requiredCredits: number = 1,
  ): Promise<{ hasCredits: boolean; availableCredits: number }> {

    console.log(`Checking credits for merchant ${merchantId}: type=${creditType}, required=${requiredCredits}`);
    const wallet = await this.merchantWalletRepository.findOne({
      where: { merchant_id: merchantId },
    });

    console.log('Merchant wallet:', wallet);

    if (!wallet) {
      return { hasCredits: false, availableCredits: 0 };
    }

    let availableCredits = 0;
    let hasCredits = false;

    switch (creditType) {
      case 'whatsapp_ui':
        availableCredits = wallet.whatsapp_ui_credits;
        hasCredits = wallet.whatsapp_ui_credits >= requiredCredits;
        console.log(`Available WhatsApp UI credits: ${availableCredits}, Has enough: ${hasCredits}`);
        break;
      case 'whatsapp_bi':
        availableCredits = wallet.whatsapp_bi_credits;
        hasCredits = wallet.whatsapp_bi_credits >= requiredCredits;
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
      // Get subscription fee from settings
      const settings = await this.superAdminSettingsService.getSettings();
      const subscriptionFee = parseFloat(settings.admin_annual_subscription_fee.toString());

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
        is_subscription_expired: false,
        is_active: true, // Activate the subscription
      });

      // Create debit transaction for admin wallet
      await queryRunner.manager.save(WalletTransaction, {
        admin_wallet_id: adminWallet.id,
        type: 'agent_subscription_fee',
        amount: subscriptionFee,
        status: 'completed',
        description: `Annual subscription payment to platform`,
        metadata: JSON.stringify({ subscription_expires_at: oneYearFromNow }),
        completed_at: new Date(),
      });

      // Get super admin wallet within transaction
      const superAdminWallet = await queryRunner.manager.findOne(SuperAdminWallet, {
        where: { is_active: true },
      });

      if (!superAdminWallet) {
        throw new NotFoundException('Super admin wallet not found');
      }

      // Credit super admin wallet
      await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
        balance: parseFloat(superAdminWallet.balance.toString()) + subscriptionFee,
        total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + subscriptionFee,
        revenue_admin_annual_subscription_fee: parseFloat(superAdminWallet.revenue_admin_annual_subscription_fee.toString()) + subscriptionFee,
      });

      // Create transaction for super admin
      await queryRunner.manager.save(WalletTransaction, {
        super_admin_wallet_id: superAdminWallet.id,
        type: 'agent_subscription_fee',
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
        { admin_id: adminId, subscription_expires_at: oneYearFromNow, is_subscription_expired: false },
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Admin subscription payment processed successfully',
        data: {
          adminId,
          subscriptionFee,
          subscriptionExpiresAt: oneYearFromNow,
          isSubscriptionExpired: false,
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
   * Process admin initial subscription with optional wallet balance
   * This combines subscription activation and wallet top-up in a single transaction
   */
  async processAdminSubscriptionWithBalance(
    adminId: number,
    walletBalance: number = 0,
    metadata?: any,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get subscription fee from settings
      const settings = await this.superAdminSettingsService.getSettings();
      const subscriptionFee = parseFloat(settings.admin_annual_subscription_fee.toString());

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

      // Calculate new balance if wallet balance is provided
      const currentBalance = parseFloat(adminWallet.balance.toString());
      const newBalance = currentBalance + walletBalance;

      // Update admin wallet subscription and balance (balance top-up is not commission income)
      await queryRunner.manager.update(AdminWallet, adminWallet.id, {
        subscription_expires_at: oneYearFromNow,
        is_subscription_expired: false,
        is_active: true, // Activate the subscription
        balance: newBalance,
      });

      // Create subscription fee transaction for admin wallet
      await queryRunner.manager.save(WalletTransaction, {
        admin_wallet_id: adminWallet.id,
        type: 'agent_subscription_fee',
        amount: subscriptionFee,
        status: 'completed',
        description: `Annual subscription payment to platform`,
        metadata: JSON.stringify({
          subscription_expires_at: oneYearFromNow,
          ...metadata
        }),
        completed_at: new Date(),
      });

      // If wallet balance was added, create a credit transaction
      if (walletBalance > 0) {
        await queryRunner.manager.save(WalletTransaction, {
          admin_wallet_id: adminWallet.id,
          type: 'credit',
          amount: walletBalance,
          status: 'completed',
          description: `Initial wallet balance top-up`,
          balance_before: currentBalance,
          balance_after: newBalance,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          completed_at: new Date(),
        });
      }

      // Get super admin wallet within transaction
      const superAdminWallet = await queryRunner.manager.findOne(SuperAdminWallet, {
        where: { is_active: true },
      });

      if (!superAdminWallet) {
        throw new NotFoundException('Super admin wallet not found');
      }

      // Credit super admin wallet with subscription fee only (not the prepaid balance)
      await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
        balance: parseFloat(superAdminWallet.balance.toString()) + subscriptionFee,
        total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + subscriptionFee,
        revenue_admin_annual_subscription_fee: parseFloat(superAdminWallet.revenue_admin_annual_subscription_fee.toString()) + subscriptionFee,
      });

      // Create transaction for super admin
      await queryRunner.manager.save(WalletTransaction, {
        super_admin_wallet_id: superAdminWallet.id,
        type: 'agent_subscription_fee',
        amount: subscriptionFee,
        status: 'completed',
        description: `Admin subscription payment from admin #${adminId}${walletBalance > 0 ? ` (+ ${walletBalance} wallet balance)` : ''}`,
        metadata: JSON.stringify({
          admin_id: adminId,
          wallet_balance_added: walletBalance,
        }),
        completed_at: new Date(),
      });

      // Log the transaction
      await this.systemLogService.logWallet(
        SystemLogAction.CREDIT_ADD,
        `Admin subscription fee ${settings.currency} ${subscriptionFee} received from admin #${adminId}${walletBalance > 0 ? ` with ${settings.currency} ${walletBalance} wallet balance` : ''}`,
        superAdminWallet.super_admin_id,
        'super_admin',
        subscriptionFee,
        {
          admin_id: adminId,
          subscription_expires_at: oneYearFromNow,
          is_subscription_expired: false,
          wallet_balance_added: walletBalance,
        },
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Admin subscription and wallet balance processed successfully',
        data: {
          adminId,
          subscriptionFee,
          walletBalance,
          totalPaid: subscriptionFee + walletBalance,
          newWalletBalance: newBalance,
          subscriptionExpiresAt: oneYearFromNow,
          isSubscriptionExpired: false,
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
   * Validate admin wallet balance for a given package ID
   */
  async validateWalletBalance(
    packageId: number,
    adminId: number | null | undefined,
  ): Promise<{ isValid: boolean; required: number; available: number }> {
    const creditPackage = await this.creditPackageRepository.findOne({
      where: { id: packageId },
    });

    if (!creditPackage) {
      throw new NotFoundException('Credit package not found');
    }

    if (!adminId) {
      throw new BadRequestException('Admin ID is required to validate wallet balance');
    }

    const adminWallet = await this.adminWalletRepository.findOne({
      where: { admin_id: adminId },
    });

    if (!adminWallet) {
      throw new NotFoundException('Admin wallet not found');
    }
    console.log(`Validating wallet balance for admin ${adminId} and package ${packageId}: required=${creditPackage.price}, available=${adminWallet.balance}`);

    const requiredBalance = parseFloat(creditPackage.price as any);
    const availableBalance = parseFloat(adminWallet.balance as any);

    if (availableBalance >= requiredBalance) {
      
      return {
        isValid: true,
        required: requiredBalance,
        available: availableBalance,
      };
    }
    else {
      return {
        isValid: false,
        required: requiredBalance,
        available: availableBalance,
      };

    }


  }
}
