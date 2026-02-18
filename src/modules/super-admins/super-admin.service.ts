import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { SuperAdmin } from './entities/super-admin.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permission-management/roles/entities/role.entity';
import { UserHasRole } from '../roles-permission-management/user-has-role/entities/user-has-role.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import * as bcrypt from 'bcrypt';
import { WalletService } from '../wallets/wallet.service';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject('SUPER_ADMIN_REPOSITORY')
    private superAdminRepository: Repository<SuperAdmin>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private walletService: WalletService,
  ) {}

  async create(createSuperAdminDto: CreateSuperAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find super_admin role
      const role = await queryRunner.manager.findOne(Role, {
        where: { name: 'super_admin' },
      });
      if (!role) {
        throw new HttpException('Super Admin role not found', 404);
      }

      const hashedPassword = await bcrypt.hash(createSuperAdminDto.password, 10);
      
      // Create user
      const user = queryRunner.manager.create(User, {
        name: createSuperAdminDto.name,
        email: createSuperAdminDto.email,
        phone: createSuperAdminDto.phone,
        password: hashedPassword,
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

      // Create super admin
      const superAdmin = queryRunner.manager.create(SuperAdmin, {
        user_id: savedUser.id,
        address: createSuperAdminDto.address,
      });
      const savedSuperAdmin = await queryRunner.manager.save(superAdmin);

      // Create super admin wallet
      const superAdminWallet = queryRunner.manager.create('SuperAdminWallet', {
        super_admin_id: savedSuperAdmin.id,
        balance: 0,
        total_earnings: 0,
        total_spent: 0,
        pending_amount: 0,
        currency: 'USD',
        admin_subscription_fee: 1199.00,
        is_active: true,
      });
      await queryRunner.manager.save(superAdminWallet);

      await queryRunner.commitTransaction();

      return {
        message: 'Super Admin created successfully',
        data: instanceToPlain(savedSuperAdmin),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to create super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, pageSize: number = 20, search = '', isActive?: boolean) {
    const queryBuilder = this.superAdminRepository
      .createQueryBuilder('superAdmin')
      .leftJoinAndSelect('superAdmin.user', 'user')
      .where('user.deleted_at IS NULL');
      
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('superAdmin.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [superAdmins, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: instanceToPlain(superAdmins),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }
    return {
      message: 'Success fetching super admin',
      data: instanceToPlain(superAdmin),
    };
  }

  async getDashboardAnalytics(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const hasDateFilter = start && end;

    const dataSource = this.dataSource;

    const adminStats = await dataSource.query(`
      SELECT 
        COUNT(*) AS total_admins,
        COUNT(*) FILTER (WHERE u.is_active = TRUE) AS active_admins,
        COUNT(*) FILTER (WHERE u.is_active = FALSE) AS inactive_admins
      FROM admins a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.deleted_at IS NULL
      ${hasDateFilter ? 'AND a.created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const merchantStats = await dataSource.query(`
      SELECT 
        COUNT(*) AS total_merchants,
        COUNT(*) FILTER (WHERE u.is_active = TRUE) AS active_merchants,
        COUNT(*) FILTER (WHERE u.is_active = FALSE) AS inactive_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'annual') AS annual_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'temporary') AS temporary_merchants
      FROM merchants m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.deleted_at IS NULL
      ${hasDateFilter ? 'AND m.created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const customerStats = await dataSource.query(`
      SELECT COUNT(*) AS total_customers 
      FROM customers
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const feedbackStats = await dataSource.query(`
      SELECT COUNT(*) AS total_feedbacks
      FROM feedbacks
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const couponStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'issued') AS total_issued,
        COUNT(*) FILTER (WHERE status = 'redeemed') AS total_redeemed
      FROM coupons
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const revenueTotals = await dataSource.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'agent_subscription_fee'), 0) AS agent_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_annual_subscription_commission'), 0) AS annual_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_package_commission'), 0) AS credit_purchase_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type IN ('agent_subscription_fee', 'merchant_annual_subscription_commission', 'merchant_package_commission')), 0) AS total_commissions
      FROM wallet_transactions
      WHERE super_admin_wallet_id IS NOT NULL
      ${hasDateFilter ? 'AND created_at BETWEEN $1 AND $2' : ''}
    `, hasDateFilter ? [start, end] : []);

    const monthlyRevenue = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0) AS revenue,
        COALESCE(SUM(amount) FILTER (WHERE type IN ('agent_subscription_fee', 'merchant_annual_subscription_commission', 'merchant_package_commission')), 0) AS commissions
      FROM wallet_transactions
      WHERE super_admin_wallet_id IS NOT NULL
      ${hasDateFilter ? 'AND created_at BETWEEN $1 AND $2' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [start, end] : []);

    const merchantGrowth = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*) AS new_merchants
      FROM merchants
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [start, end] : []);

    const customerGrowth = await dataSource.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*) AS new_customers
      FROM customers
      ${hasDateFilter ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, hasDateFilter ? [start, end] : []);

    const topMerchants = await dataSource.query(`
      SELECT 
        m.id AS merchant_id,
        m.business_name,
        COUNT(*) FILTER (WHERE c.status = 'issued' ${hasDateFilter ? 'AND c.created_at BETWEEN $1 AND $2' : ''}) AS total_coupons_issued,
        COUNT(*) FILTER (WHERE c.status = 'redeemed' ${hasDateFilter ? 'AND c.created_at BETWEEN $1 AND $2' : ''}) AS total_coupons_redeemed
      FROM merchants m
      LEFT JOIN coupons c ON c.merchant_id = m.id
      ${hasDateFilter ? 'WHERE c.created_at BETWEEN $1 AND $2' : ''}
      GROUP BY m.id, m.business_name
      HAVING COUNT(c.id) > 0
      ORDER BY total_coupons_redeemed DESC
      LIMIT 10
    `, hasDateFilter ? [start, end] : []);

    return {
      message: 'Super admin dashboard analytics retrieved successfully',
      data: {
        overview: {
          totalAdmins: parseInt(adminStats[0]?.total_admins || '0', 10),
          activeAdmins: parseInt(adminStats[0]?.active_admins || '0', 10),
          inactiveAdmins: parseInt(adminStats[0]?.inactive_admins || '0', 10),
          totalMerchants: parseInt(merchantStats[0]?.total_merchants || '0', 10),
          activeMerchants: parseInt(merchantStats[0]?.active_merchants || '0', 10),
          inactiveMerchants: parseInt(merchantStats[0]?.inactive_merchants || '0', 10),
          annualMerchants: parseInt(merchantStats[0]?.annual_merchants || '0', 10),
          temporaryMerchants: parseInt(merchantStats[0]?.temporary_merchants || '0', 10),
          totalCustomers: parseInt(customerStats[0]?.total_customers || '0', 10),
          totalCouponsIssued: parseInt(couponStats[0]?.total_issued || '0', 10),
          totalCouponsRedeemed: parseInt(couponStats[0]?.total_redeemed || '0', 10),
          totalFeedbackSubmissions: parseInt(feedbackStats[0]?.total_feedbacks || '0', 10),
        },
        revenue: {
          totalCommissions: parseFloat(revenueTotals[0]?.total_commissions || '0'),
          agentSubscriptionRevenue: parseFloat(revenueTotals[0]?.agent_subscription_revenue || '0'),
          annualSubscriptionRevenue: parseFloat(revenueTotals[0]?.annual_subscription_revenue || '0'),
          creditPurchaseRevenue: parseFloat(revenueTotals[0]?.credit_purchase_revenue || '0'),
          monthlyRevenue: monthlyRevenue.map((mr: any) => ({
            month: mr.month,
            revenue: parseFloat(mr.revenue) || 0,
            commissions: parseFloat(mr.commissions) || 0,
          })),
        },
        growth: {
          monthlyMerchants: merchantGrowth.map((m: any) => ({
            month: m.month,
            newMerchants: parseInt(m.new_merchants || '0', 10),
          })),
          monthlyCustomers: customerGrowth.map((c: any) => ({
            month: c.month,
            newCustomers: parseInt(c.new_customers || '0', 10),
          })),
        },
        topMerchants: topMerchants.map((m: any) => ({
          merchantId: m.merchant_id,
          businessName: m.business_name,
          totalCouponsIssued: parseInt(m.total_coupons_issued || '0', 10),
          totalCouponsRedeemed: parseInt(m.total_coupons_redeemed || '0', 10),
        })),
      },
    };
  }

  async update(id: number, updateSuperAdminDto: UpdateSuperAdminDto) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const user = await userRepo.findOne({ where: { id: superAdmin.user_id } });

      if (!user) {
        throw new HttpException('User not found', 404);
      }

      // Update user fields
      if (updateSuperAdminDto.name !== undefined) {
        user.name = updateSuperAdminDto.name;
      }
      if (updateSuperAdminDto.email !== undefined) {
        user.email = updateSuperAdminDto.email;
      }
      if (updateSuperAdminDto.phone !== undefined) {
        user.phone = updateSuperAdminDto.phone;
      }
      if (updateSuperAdminDto.password) {
        user.password = await bcrypt.hash(updateSuperAdminDto.password, 10);
      }

      await queryRunner.manager.save(user);

      // Update super admin fields
      if (updateSuperAdminDto.address !== undefined) {
        superAdmin.address = updateSuperAdminDto.address;
      }

      const updatedSuperAdmin = await queryRunner.manager.save(superAdmin);

      await queryRunner.commitTransaction();

      const result = await this.superAdminRepository.findOne({
        where: { id: updatedSuperAdmin.id },
        relations: ['user'],
      });

      return {
        message: 'Super Admin updated successfully',
        data: instanceToPlain(result),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const superAdmin = await this.superAdminRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!superAdmin) {
      throw new HttpException('Super Admin not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete super admin
      await queryRunner.manager.softDelete(SuperAdmin, id);
      
      // Soft delete associated user
      await queryRunner.manager.softDelete(User, superAdmin.user_id);

      await queryRunner.commitTransaction();

      return {
        message: 'Super Admin deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to delete super admin',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
