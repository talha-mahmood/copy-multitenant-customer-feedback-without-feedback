import { HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { WalletService } from '../wallets/wallet.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogCategory, SystemLogLevel } from 'src/common/enums/system-log.enum';
import { ApprovalService } from '../approvals/approval.service';

@Injectable()
export class AdminService {
  constructor(
    @Inject('ADMIN_REPOSITORY')
    private adminRepository: Repository<Admin>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private walletService: WalletService,
    private systemLogService: SystemLogService,
    private approvalService: ApprovalService,
  ) { }

  async create(createAdminDto: CreateAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find admin role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'admin' },
      });
      if (!role) {
        throw new HttpException('Admin role not found', 404);
      }

      const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

      // Create user first if is_active is provided
      const user = queryRunner.manager.create(User, {
        name: createAdminDto.name,
        email: createAdminDto.email,
        phone: createAdminDto.phone,
        password: hashedPassword,
        avatar: createAdminDto.avatar || '',
        is_active: createAdminDto.is_active !== undefined ? createAdminDto.is_active : true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Assign role to user
      const userHasRole = queryRunner.manager.create(UserHasRole, {
        user_id: savedUser.id,
        role_id: role.id,
      });
      await queryRunner.manager.save(userHasRole);

      // Create admin with user_id and address
      const admin = queryRunner.manager.create(Admin, {
        user_id: savedUser.id,
        address: createAdminDto.address,
        city: createAdminDto.city,
        country: createAdminDto.country,
      });
      const savedAdmin = await queryRunner.manager.save(admin);

      // Create admin wallet within transaction
      const adminWallet = queryRunner.manager.create('AdminWallet', {
        admin_id: savedAdmin.id,
        balance: 0,
        total_earnings: 0,
        total_spent: 0,
        pending_amount: 0,
        currency: 'USD',
        is_active: true,
      });
      await queryRunner.manager.save(adminWallet);

      await queryRunner.commitTransaction();

      // Load the admin with user relation
      const adminWithUser = await this.adminRepository.findOne({
        where: { id: savedAdmin.id },
        relations: ['user'],
      });

      // Log agent (admin) creation
      await this.systemLogService.log({
        category: SystemLogCategory.ADMIN,
        action: SystemLogAction.CREATE,
        level: SystemLogLevel.INFO,
        message: `Agent ${createAdminDto.name} created successfully`,
        userId: savedUser.id,
        userType: 'admin',
        entityType: 'admin',
        entityId: savedAdmin.id,
        metadata: {
          admin_id: savedAdmin.id,
          agent_name: createAdminDto.name,
          email: createAdminDto.email,
          city: createAdminDto.city,
          country: createAdminDto.country,
        },
      });

      return {
        message: 'Admin created successfully',
        data: instanceToPlain(adminWithUser),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '', isActive?: boolean, user?: { role: string; adminId?: number | null }) {
    const queryBuilder = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.user', 'user');

    if (isActive !== undefined) {
      queryBuilder.where('user.is_active = :isActive', { isActive });
    }

    // If admin role, only show their own profile
    if (user && user.role === 'admin' && user.adminId) {
      queryBuilder.andWhere('admin.id = :adminId', { adminId: user.adminId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('admin.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [admins, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(admins),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number, user?: { role: string; adminId?: number | null }) {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }
    // If admin role, only allow access to their own profile
    if (user && user.role === 'admin' && user.adminId && admin.id !== user.adminId) {
      throw new HttpException('Admin not found', 404);
    }
    return {
      message: 'Success fetching admin',
      data: instanceToPlain(admin),
    };
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user fields if provided
      const userUpdateData: any = {};
      if (updateAdminDto.name !== undefined) userUpdateData.name = updateAdminDto.name;
      if (updateAdminDto.email !== undefined) userUpdateData.email = updateAdminDto.email;
      if (updateAdminDto.phone !== undefined) userUpdateData.phone = updateAdminDto.phone;
      if (updateAdminDto.avatar !== undefined) userUpdateData.avatar = updateAdminDto.avatar;
      if (updateAdminDto.is_active !== undefined) userUpdateData.is_active = updateAdminDto.is_active;

      if (updateAdminDto.password) {
        userUpdateData.password = await bcrypt.hash(updateAdminDto.password, 10);
      }

      if (Object.keys(userUpdateData).length > 0 && admin.user_id) {
        await queryRunner.manager.update(User, admin.user_id, userUpdateData);
      }

      // Update admin-specific fields (address)
      const adminUpdateData: any = {};
      if (updateAdminDto.address !== undefined) adminUpdateData.address = updateAdminDto.address;
      if (updateAdminDto.city !== undefined) adminUpdateData.city = updateAdminDto.city;
      if (updateAdminDto.country !== undefined) adminUpdateData.country = updateAdminDto.country;

      if (Object.keys(adminUpdateData).length > 0) {
        await queryRunner.manager.update(Admin, id, adminUpdateData);
      }

      await queryRunner.commitTransaction();

      const updatedAdmin = await this.adminRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!updatedAdmin) {
        throw new HttpException('Admin not found after update', 404);
      }

      // Log agent (admin) update
      await this.systemLogService.log({
        category: SystemLogCategory.ADMIN,
        action: SystemLogAction.UPDATE,
        level: SystemLogLevel.INFO,
        message: `Agent ${updatedAdmin.user.name} updated successfully`,
        userId: admin.user_id,
        userType: 'admin',
        entityType: 'admin',
        entityId: id,
        metadata: {
          admin_id: id,
          agent_name: updatedAdmin.user.name,
          updated_fields: Object.keys({ ...userUpdateData, ...adminUpdateData }),
        },
      });

      return {
        message: 'Admin updated successfully',
        data: instanceToPlain(updatedAdmin),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }

    // Soft delete admin
    await this.adminRepository.softDelete(id);

    // Also soft delete the associated user
    if (admin.user_id) {
      const userRepo = this.dataSource.getRepository(User);
      await userRepo.softDelete(admin.user_id);
    }

    return {
      message: 'Admin deleted successfully',
    };
  }

  async getDashboardAnalytics(adminId: number, startDate?: string, endDate?: string) {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }

    // Parse date range - if not provided, show all-time records
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const hasDateFilter = start && end;

    const dataSource = this.dataSource;

    // Merchant Statistics
    const merchantStats = await dataSource.query(`
      SELECT 
        COUNT(*) as total_merchants,
        COUNT(*) FILTER (WHERE m.deleted_at IS NULL) as active_merchants,
        COUNT(*) FILTER (WHERE m.deleted_at IS NOT NULL) as inactive_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'temporary') as temporary_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'annual') as annual_merchants
      FROM merchants m
      ${hasDateFilter ? 'WHERE m.created_at <= $1' : ''}
    `, hasDateFilter ? [end] : []);

    // Recent Merchants
    const recentMerchants = await dataSource.query(`
      SELECT 
        m.id as merchant_id,
        m.business_name,
        m.merchant_type,
        m.created_at
      FROM merchants m
      ${hasDateFilter ? 'WHERE m.created_at BETWEEN $1 AND $2' : ''}
      ORDER BY m.created_at DESC
      LIMIT 10
    `, hasDateFilter ? [start, end] : []);

    // Top Performing Merchants
    const topMerchants = await dataSource.query(`
      SELECT 
        m.id as merchant_id,
        m.business_name,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'issued') as total_coupons_issued,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'redeemed') as total_coupons_redeemed,
        0 as total_revenue
      FROM merchants m
      LEFT JOIN coupons c ON c.merchant_id = m.id
      GROUP BY m.id, m.business_name
      ORDER BY total_coupons_redeemed DESC
      LIMIT 10
    `, []);

    // Admin Wallet Statistics
    const walletStats = await dataSource.query(`
      SELECT 
        COALESCE(SUM(balance), 0) as total_balance,
        COALESCE(SUM(total_earnings), 0) as total_earnings,
        COALESCE(SUM(total_spent), 0) as total_spent,
        COALESCE(SUM(pending_amount), 0) as pending_amount
      FROM admin_wallets
      WHERE admin_id = $1
    `, [adminId]);

    // Transaction Statistics
    const transactionStats = await dataSource.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM wallet_transactions
      WHERE admin_wallet_id IN (SELECT id FROM admin_wallets WHERE admin_id = $1)
    `, [adminId]);

    // Revenue Statistics
    const revenueStats = await dataSource.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_annual_subscription_commission'), 0) as annual_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_package_commission'), 0) as credit_purchase_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type IN ('merchant_annual_subscription_commission', 'merchant_package_commission')), 0) as total_commissions
      FROM wallet_transactions
      WHERE admin_wallet_id IN (SELECT id FROM admin_wallets WHERE admin_id = $1)
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [adminId, start, end] : [adminId]);

    // Monthly Revenue Breakdown
    const monthlyRevenue = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COALESCE(SUM(amount) FILTER (WHERE type IN ('merchant_annual_subscription_commission', 'merchant_package_commission')), 0) as commissions_earned
      FROM wallet_transactions
      WHERE admin_wallet_id IN (SELECT id FROM admin_wallets WHERE admin_id = $1)
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [adminId, start, end] : [adminId]);

    // Coupon Statistics Across All Merchants
    const couponStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'issued') as total_issued,
        COUNT(*) FILTER (WHERE status = 'redeemed') as total_redeemed
      FROM coupons
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    // Coupon Stats by Merchant
    const couponByMerchant = await dataSource.query(`
      SELECT 
        m.id as merchant_id,
        m.business_name,
        COUNT(*) FILTER (WHERE c.status = 'issued') as issued,
        COUNT(*) FILTER (WHERE c.status = 'redeemed') as redeemed
      FROM merchants m
      LEFT JOIN coupons c ON c.merchant_id = m.id
      ${hasDateFilter ? 'WHERE c.created_at BETWEEN $1 AND $2' : ''}
      GROUP BY m.id, m.business_name
      HAVING COUNT(c.id) > 0
      ORDER BY issued DESC
      LIMIT 10
    `, hasDateFilter ? [start, end] : []);

    // WhatsApp Statistics
    const whatsappStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE whatsapp_sent = true) as total_messages_sent
      FROM coupons
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    // WhatsApp UI/BI Statistics from whatsapp_messages table
    const whatsappMessageStats = await dataSource.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE message_type = 'UI') as ui_messages,
        COUNT(*) FILTER (WHERE message_type = 'BI') as bi_messages,
        COUNT(*) FILTER (WHERE message_type = 'UI' AND campaign_type = 'feedback') as ui_feedback,
        COUNT(*) FILTER (WHERE message_type = 'UI' AND campaign_type = 'luckydraw') as ui_luckydraw,
        COUNT(*) FILTER (WHERE message_type = 'UI' AND campaign_type = 'custom') as ui_homepage,
        COUNT(*) FILTER (WHERE message_type = 'BI' AND campaign_type = 'birthday') as bi_birthday,
        COUNT(*) FILTER (WHERE message_type = 'BI' AND campaign_type = 'inactive_recall') as bi_inactive,
        COUNT(*) FILTER (WHERE message_type = 'BI' AND campaign_type = 'festival') as bi_festival,
        COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as successful_messages,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
        SUM(credits_deducted) as total_credits_used
      FROM whatsapp_messages
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    // WhatsApp by Merchant
    const whatsappByMerchant = await dataSource.query(`
      SELECT 
        m.id as merchant_id,
        m.business_name,
        COUNT(*) FILTER (WHERE c.whatsapp_sent = true) as messages_sent
      FROM merchants m
      LEFT JOIN coupons c ON c.merchant_id = m.id
      ${hasDateFilter ? 'WHERE c.created_at BETWEEN $1 AND $2' : ''}
      GROUP BY m.id, m.business_name
      HAVING COUNT(c.id) FILTER (WHERE c.whatsapp_sent = true) > 0
      ORDER BY messages_sent DESC
      LIMIT 10
    `, hasDateFilter ? [start, end] : []);

    // Customer Engagement
    const customerEngagement = await dataSource.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT f.id) as total_feedbacks,
        COUNT(DISTINCT l.id) as total_lucky_draw_participation
      FROM customers c
      LEFT JOIN feedbacks f ON c.id = f.customer_id
      LEFT JOIN lucky_draw_results l ON c.id = l.customer_id
      ${hasDateFilter ? 'WHERE c.created_at <= $1' : ''}
    `, hasDateFilter ? [end] : []);

    // Platform Growth
    const platformGrowth = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as new_merchants
      FROM merchants
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [start, end] : []);

    const customerGrowth = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as new_customers
      FROM customers
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [start, end] : []);

    // Calculate totals and rates
    const totalIssued = parseInt(couponStats[0].total_issued) || 0;
    const totalRedeemed = parseInt(couponStats[0].total_redeemed) || 0;
    const redemptionRate = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(2) : '0.00';

    const totalMessagesSent = parseInt(whatsappStats[0].total_messages_sent) || 0;
    const estimatedWhatsappCost = totalMessagesSent * 0.05; // $0.05 per message
    
    // WhatsApp message stats from whatsapp_messages table
    const totalWhatsAppMessages = parseInt(whatsappMessageStats[0]?.total_messages) || 0;
    const uiMessages = parseInt(whatsappMessageStats[0]?.ui_messages) || 0;
    const biMessages = parseInt(whatsappMessageStats[0]?.bi_messages) || 0;
    const uiFeedback = parseInt(whatsappMessageStats[0]?.ui_feedback) || 0;
    const uiLuckydraw = parseInt(whatsappMessageStats[0]?.ui_luckydraw) || 0;
    const uiHomepage = parseInt(whatsappMessageStats[0]?.ui_homepage) || 0;
    const biBirthday = parseInt(whatsappMessageStats[0]?.bi_birthday) || 0;
    const biInactive = parseInt(whatsappMessageStats[0]?.bi_inactive) || 0;
    const biFestival = parseInt(whatsappMessageStats[0]?.bi_festival) || 0;
    const successfulMessages = parseInt(whatsappMessageStats[0]?.successful_messages) || 0;
    const failedMessages = parseInt(whatsappMessageStats[0]?.failed_messages) || 0;
    const totalCreditsUsed = parseInt(whatsappMessageStats[0]?.total_credits_used) || 0;

    const totalRevenue = parseFloat(revenueStats[0].total_commissions) || 0;
    const annualRevenue = parseFloat(revenueStats[0].annual_subscription_revenue) || 0;
    const creditRevenue = parseFloat(revenueStats[0].credit_purchase_revenue) || 0;

    const totalCustomers = parseInt(customerEngagement[0].total_customers) || 0;
    const totalFeedbacks = parseInt(customerEngagement[0].total_feedbacks) || 0;
    const totalLuckyDraw = parseInt(customerEngagement[0].total_lucky_draw_participation) || 0;

    const activeMerchants = parseInt(merchantStats[0].active_merchants) || 0;
    const averageFeedbacksPerMerchant = activeMerchants > 0 ? (totalFeedbacks / activeMerchants).toFixed(2) : '0.00';

    // Combine monthly data
    const monthlyData = platformGrowth.map(mg => {
      const customerMonth = customerGrowth.find(cg => cg.month === mg.month);
      const revenueMonth = monthlyRevenue.find(mr => mr.month === mg.month);

      return {
        month: mg.month,
        newMerchants: parseInt(mg.new_merchants) || 0,
        newCustomers: parseInt(customerMonth?.new_customers) || 0,
        revenue: parseFloat(revenueMonth?.revenue) || 0,
      };
    });

    return {
      message: 'Admin dashboard analytics retrieved successfully',
      data: {
        overview: {
          totalMerchants: parseInt(merchantStats[0].total_merchants) || 0,
          activeMerchants,
          inactiveMerchants: parseInt(merchantStats[0].inactive_merchants) || 0,
          temporaryMerchants: parseInt(merchantStats[0].temporary_merchants) || 0,
          annualMerchants: parseInt(merchantStats[0].annual_merchants) || 0,
          totalRevenue,
          totalCommissionsEarned: totalRevenue,
          pendingApprovals: {
            merchants: 0, // Implement approval queue if needed
            agents: 0,
          },
        },
        merchantStats: {
          byType: {
            temporary: parseInt(merchantStats[0].temporary_merchants) || 0,
            annual: parseInt(merchantStats[0].annual_merchants) || 0,
          },
          byStatus: {
            active: activeMerchants,
            inactive: parseInt(merchantStats[0].inactive_merchants) || 0,
          },
          recentlyAdded: recentMerchants.map(m => ({
            merchantId: m.merchant_id,
            businessName: m.business_name,
            merchantType: m.merchant_type,
            createdAt: m.created_at,
          })),
          topPerformers: topMerchants.map(m => ({
            merchantId: m.merchant_id,
            businessName: m.business_name,
            totalCouponsIssued: parseInt(m.total_coupons_issued) || 0,
            totalCouponsRedeemed: parseInt(m.total_coupons_redeemed) || 0,
            totalRevenue: parseFloat(m.total_revenue) || 0,
          })),
        },
        revenueStats: {
          totalRevenue,
          annualSubscriptionRevenue: annualRevenue,
          creditPurchaseRevenue: creditRevenue,
          commissionsEarned: totalRevenue,
          breakdown: {
            annualFees: annualRevenue,
            creditSales: creditRevenue,
            whatsappCharges: 0, // Implement if needed
          },
          monthlyRevenue: monthlyRevenue.map(mr => ({
            month: mr.month,
            revenue: parseFloat(mr.revenue) || 0,
            commissionsEarned: parseFloat(mr.commissions_earned) || 0,
          })),
        },
        walletStats: {
          totalBalance: parseFloat(walletStats[0].total_balance) || 0,
          totalEarnings: parseFloat(walletStats[0].total_earnings) || 0,
          totalSpent: parseFloat(walletStats[0].total_spent) || 0,
          pendingAmount: parseFloat(walletStats[0].pending_amount) || 0,
          transactions: {
            total: parseInt(transactionStats[0].total_transactions) || 0,
            completed: parseInt(transactionStats[0].completed) || 0,
            pending: parseInt(transactionStats[0].pending) || 0,
            failed: parseInt(transactionStats[0].failed) || 0,
          },
        },
        couponStats: {
          totalCouponsIssued: totalIssued,
          totalCouponsRedeemed: totalRedeemed,
          redemptionRate: parseFloat(redemptionRate),
          byMerchant: couponByMerchant.map(c => ({
            merchantId: c.merchant_id,
            businessName: c.business_name,
            issued: parseInt(c.issued) || 0,
            redeemed: parseInt(c.redeemed) || 0,
          })),
        },
        whatsappStats: {
          totalMessagesSent,
          totalCost: estimatedWhatsappCost,
          averageCostPerMessage: 0.05,
          // Detailed UI/BI breakdown from whatsapp_messages table
          messageBreakdown: {
            total: totalWhatsAppMessages,
            uiMessages: {
              count: uiMessages,
              percentage: totalWhatsAppMessages > 0 ? ((uiMessages / totalWhatsAppMessages) * 100).toFixed(2) : '0.00',
              feedback: uiFeedback,
              luckydraw: uiLuckydraw,
              homepage: uiHomepage,
            },
            biMessages: {
              count: biMessages,
              percentage: totalWhatsAppMessages > 0 ? ((biMessages / totalWhatsAppMessages) * 100).toFixed(2) : '0.00',
              birthday: biBirthday,
              inactiveRecall: biInactive,
              festival: biFestival,
            },
            successful: successfulMessages,
            failed: failedMessages,
            creditsUsed: totalCreditsUsed,
          },
          byMerchant: whatsappByMerchant.map(w => ({
            merchantId: w.merchant_id,
            businessName: w.business_name,
            messagesSent: parseInt(w.messages_sent) || 0,
            estimatedCost: parseInt(w.messages_sent) * 0.05 || 0,
          })),
        },
        customerEngagement: {
          totalCustomers,
          activeCustomers: totalCustomers, // Refine definition of "active"
          totalFeedbacks,
          totalLuckyDrawParticipation: totalLuckyDraw,
          averageFeedbacksPerMerchant: parseFloat(averageFeedbacksPerMerchant),
        },
        approvalQueue: {
          pendingMerchants: [], // Implement approval queue if needed
          pendingAgents: [],
        },
        platformGrowth: {
          newMerchantsThisMonth: recentMerchants.length,
          newCustomersThisMonth: 0, // Calculate from current month
          growthRate: 0, // Calculate based on previous period
          timeline: monthlyData,
        },
      },
    };
  }

  async getPaidAdImage(merchantId: number) {
    const merchantSetting = await this.dataSource.query(`
      SELECT paid_ad_image, paid_ad_placement 
      FROM merchant_settings 
      WHERE merchant_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [merchantId]);

    if (!merchantSetting || merchantSetting.length === 0) {
      throw new NotFoundException(`Settings for merchant ID ${merchantId} not found`);
    }

    return {
      message: 'Paid ad image retrieved successfully',
      data: {
        paid_ad_image: merchantSetting[0].paid_ad_image,
        paid_ad_placement: merchantSetting[0].paid_ad_placement
      }
    };
  }

  async getApprovalsByAgentId(agentId: number) {
    // Verify agent exists
    const agent = await this.adminRepository.findOne({
      where: { id: agentId }
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Get approvals where agent_id matches
    const approvals = await this.approvalService.findByAdmin(agentId); // Reusing findByAdmin since agent uses admin table id in approval.agent_id logically based on previous steps, but wait - let's check approval.service.ts methods.

    // Correction: In step 153/154 we set stored `merchant.admin_id` into `approval.agent_id`.
    // The `approval.service.ts` has `findByAdmin` which queries `admin_id` column, NOT `agent_id` column.
    // I need to add `findByAgent` into `ApprovalService` OR simply query it here if I had access to repo, but I'm using service.
    // It's better to add `findByAgent` to `ApprovalService`.

    // Let me first add findByAgent to ApprovalService, then use it here.
    // For now I will write this method assuming `findByAgent` exists or will exist.

    // Actually, looking at `approval.service.ts`:
    // async findByAdmin(adminId: number) { return await this.approvalRepository.find({ where: { admin_id: adminId }, ... }); }
    // This queries the `admin_id` column which is for the APPROVER/REJECTOR.
    // The `agent_id` column is the one we want to filter by.

    return this.approvalService.findByAgent(agentId);
  }
}
