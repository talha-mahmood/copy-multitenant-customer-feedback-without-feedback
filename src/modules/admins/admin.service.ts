import { HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { WalletService } from '../wallets/wallet.service';

@Injectable()
export class AdminService {
  constructor(
    @Inject('ADMIN_REPOSITORY')
    private adminRepository: Repository<Admin>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private walletService: WalletService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);
    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });
    const savedAdmin = await this.adminRepository.save(admin);

    // Create admin wallet
    await this.walletService.createAdminWallet(savedAdmin.id);
    return {
      message: 'Admin created successfully',
      data: instanceToPlain(savedAdmin),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '') {
    const queryBuilder = this.adminRepository.createQueryBuilder('admin');

    if (search) {
      queryBuilder.andWhere(
        '(admin.name ILIKE :search OR admin.email ILIKE :search OR admin.phone ILIKE :search)',
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

  async findOne(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }
    return {
      message: 'Success fetching admin',
      data: instanceToPlain(admin),
    };
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    await this.adminRepository.update(id, updateAdminDto);
    const updatedAdmin = await this.adminRepository.findOne({ where: { id } });
    
    return {
      message: 'Admin updated successfully',
      data: instanceToPlain(updatedAdmin),
    };
  }

  async remove(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', 404);
    }
    await this.adminRepository.softDelete(id);
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
        COALESCE(SUM(amount) FILTER (WHERE type = 'commission' AND description LIKE '%Annual subscription%'), 0) as annual_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'commission' AND description LIKE '%credit purchase%'), 0) as credit_purchase_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'commission'), 0) as total_commissions
      FROM wallet_transactions
      WHERE admin_wallet_id IN (SELECT id FROM admin_wallets WHERE admin_id = $1)
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [adminId, start, end] : [adminId]);

    // Monthly Revenue Breakdown
    const monthlyRevenue = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'commission'), 0) as commissions_earned
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
}
