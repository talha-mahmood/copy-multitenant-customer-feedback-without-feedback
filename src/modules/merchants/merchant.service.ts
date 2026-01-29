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
import { MerchantSettingService } from '../merchant-settings/merchant-setting.service';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';

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
    private merchantSettingService: MerchantSettingService,
    private systemLogService: SystemLogService,
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
        is_active: createMerchantDto.is_active !== undefined ? createMerchantDto.is_active : true,
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
        admin_id: createMerchantDto.admin_id,
        address: createMerchantDto.address,
        city: createMerchantDto.city,
        country: createMerchantDto.country,
        map_link: createMerchantDto.map_link,
        longitude: createMerchantDto.longitude,
        latitude: createMerchantDto.latitude,
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
      
      const qrCodeUrl = `${baseUrl}/customer/review?mid=${savedMerchant.id}`;
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
        whatsapp_message_credits: 0,
        paid_ad_credits: 0,
        coupon_credits: 0,
        total_credits_purchased: 0,
        total_credits_used: 0,
        subscription_type: merchantType,
        annual_fee_paid: isAnnual,
        subscription_expires_at: expiresAt,
        currency: 'USD',
        is_active: true,
      });
      await queryRunner.manager.save(merchantWallet);

      // Create default merchant settings
      await this.merchantSettingService.createDefaultSettings(savedMerchant.id, queryRunner.manager);

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

      // Log merchant creation
      await this.systemLogService.logMerchant(
        SystemLogAction.CREATE,
        savedMerchant.id,
        `Merchant ${createMerchantDto.business_name} created successfully`,
        savedUser.id,
        {
          merchant_id: savedMerchant.id,
          business_name: createMerchantDto.business_name,
          merchant_type: createMerchantDto.merchant_type,
          admin_id: createMerchantDto.admin_id,
          annual_fee_paid: merchantType === 'annual',
        },
      );

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

  async findAll(page: number = 1, pageSize: number = 20, search = '', isActive?: boolean, user?: { role: string; adminId?: number | null }) {
    const queryBuilder = this.merchantRepository
      .createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.user', 'user')
      .leftJoinAndSelect('merchant.admin', 'admin');

    if (isActive !== undefined) {
      queryBuilder.where('user.is_active = :isActive', { isActive });
    }

    // If admin, filter by adminId
    if (user && user.role === 'admin' && user.adminId) {
      console.log('Filtering merchants for admin ID:', user);
      queryBuilder.andWhere('merchant.admin_id = :adminId', { adminId: user.adminId });
    }

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

  async findOne(id: number, user?: { role: string; adminId?: number | null }) {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user', 'admin'],
    });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }
    // If admin, restrict to own merchants
    if (user && user.role === 'admin' && user.adminId && merchant.admin_id !== user.adminId) {
      throw new HttpException('Merchant not found', 404);
    }
    return {
      message: 'Success fetching merchant',
      data: instanceToPlain(merchant),
    };
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto) {
    const merchant = await this.merchantRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user fields if provided
      const userUpdateData: any = {};
      if (updateMerchantDto.name !== undefined) userUpdateData.name = updateMerchantDto.name;
      if (updateMerchantDto.email !== undefined) userUpdateData.email = updateMerchantDto.email;
      if (updateMerchantDto.is_active !== undefined) userUpdateData.is_active = updateMerchantDto.is_active;
      
      if (updateMerchantDto.password) {
        userUpdateData.password = await bcrypt.hash(updateMerchantDto.password, 10);
      }

      if (Object.keys(userUpdateData).length > 0 && merchant.user_id) {
        await queryRunner.manager.update(User, merchant.user_id, userUpdateData);
      }

      // Update merchant-specific fields
      const merchantUpdateData: any = {};
      if (updateMerchantDto.admin_id !== undefined) merchantUpdateData.admin_id = updateMerchantDto.admin_id;
      if (updateMerchantDto.address !== undefined) merchantUpdateData.address = updateMerchantDto.address;
      if (updateMerchantDto.city !== undefined) merchantUpdateData.city = updateMerchantDto.city;
      if (updateMerchantDto.country !== undefined) merchantUpdateData.country = updateMerchantDto.country;
      if (updateMerchantDto.map_link !== undefined) merchantUpdateData.map_link = updateMerchantDto.map_link;
      if (updateMerchantDto.longitude !== undefined) merchantUpdateData.longitude = updateMerchantDto.longitude;
      if (updateMerchantDto.latitude !== undefined) merchantUpdateData.latitude = updateMerchantDto.latitude;
      if (updateMerchantDto.business_name !== undefined) merchantUpdateData.business_name = updateMerchantDto.business_name;
      if (updateMerchantDto.business_type !== undefined) merchantUpdateData.business_type = updateMerchantDto.business_type;
      if (updateMerchantDto.merchant_type !== undefined) merchantUpdateData.merchant_type = updateMerchantDto.merchant_type;
      if (updateMerchantDto.tax_id !== undefined) merchantUpdateData.tax_id = updateMerchantDto.tax_id;
      
      if (Object.keys(merchantUpdateData).length > 0) {
        await queryRunner.manager.update(Merchant, id, merchantUpdateData);
      }

      await queryRunner.commitTransaction();
      
      const updatedMerchant = await this.merchantRepository.findOne({
        where: { id },
        relations: ['user', 'admin'],
      });

      // Log merchant update
      if (updatedMerchant) {
        await this.systemLogService.logMerchant(
          SystemLogAction.UPDATE,
          id,
          `Merchant ${updatedMerchant.business_name} updated`,
          merchant.user_id,
          {
            merchant_id: id,
            updated_fields: Object.keys({...userUpdateData, ...merchantUpdateData}),
          },
        );
      }
      
      return {
        message: 'Merchant updated successfully',
        data: instanceToPlain(updatedMerchant),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Failed to update merchant',
        error.status || 500,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const merchant = await this.merchantRepository.findOne({ 
      where: { id },
      relations: ['user', 'admin'],
    });
    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }
    
    // Soft delete merchant
    await this.merchantRepository.softDelete(id);
    
    // Also soft delete the associated user
    if (merchant.user_id) {
      await this.userRepository.softDelete(merchant.user_id);
    }
    
    return {
      message: 'Merchant deleted successfully',
    };
  }

  async getQRCode(id: number) {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user', 'admin'],
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
      relations: ['user', 'admin'],
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
    
    const qrCodeUrl = `${baseUrl}/customer/review?mid=${id}`;
    
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

  async getDashboardAnalytics(merchantId: number, startDate?: string, endDate?: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user', 'admin'],
    });

    if (!merchant) {
      throw new HttpException('Merchant not found', 404);
    }

    // Parse date range - if not provided, show all-time records
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const hasDateFilter = start && end;

    const dataSource = this.dataSource;

    // Coupon Statistics
    const couponStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'created') as created,
        COUNT(*) FILTER (WHERE status = 'issued') as issued,
        COUNT(*) FILTER (WHERE status = 'redeemed') as redeemed,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE whatsapp_sent = true) as whatsapp_sent
      FROM coupons
      WHERE merchant_id = $1
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [merchantId, start, end] : [merchantId]);

    // Coupon by Batch
    const couponByBatch = await dataSource.query(`
      SELECT 
        cb.id as batch_id,
        cb.batch_name,
        COUNT(*) FILTER (WHERE c.status = 'issued') as issued,
        COUNT(*) FILTER (WHERE c.status = 'redeemed') as redeemed,
        COUNT(*) FILTER (WHERE c.status = 'expired') as expired
      FROM coupon_batches cb
      LEFT JOIN coupons c ON c.batch_id = cb.id
      WHERE cb.merchant_id = $1
      GROUP BY cb.id, cb.batch_name
      ORDER BY cb.created_at DESC
    `, [merchantId]);

    // Feedback Statistics
    const feedbackStats = await dataSource.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE preset_review_id IS NOT NULL) as preset_reviews,
        COUNT(*) FILTER (WHERE preset_review_id IS NULL) as custom_reviews,
        COUNT(*) FILTER (WHERE selected_platform = 'google') as google_reviews,
        COUNT(*) FILTER (WHERE selected_platform = 'facebook') as facebook_reviews,
        COUNT(*) FILTER (WHERE selected_platform = 'instagram') as instagram_reviews,
        COUNT(*) FILTER (WHERE selected_platform = 'xiaohongshu') as xiaohongshu_reviews,
        COUNT(*) FILTER (WHERE redirect_completed = true) as completed_redirects
      FROM feedbacks
      WHERE merchant_id = $1
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [merchantId, start, end] : [merchantId]);

    // Lucky Draw Statistics
    const luckyDrawStats = await dataSource.query(`
      SELECT 
        COUNT(*) as total_spins,
        COUNT(*) FILTER (WHERE is_claimed = true) as claimed_prizes,
        COUNT(DISTINCT customer_id) as unique_participants
      FROM lucky_draw_results
      WHERE merchant_id = $1
      ${hasDateFilter ? 'AND spin_date BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [merchantId, start, end] : [merchantId]);

    // Prize Distribution
    const prizeDistribution = await dataSource.query(`
      SELECT 
        p.prize_name,
        COUNT(r.id) as times_won
      FROM lucky_draw_results r
      JOIN lucky_draw_prizes p ON r.prize_id = p.id
      WHERE r.merchant_id = $1
      ${hasDateFilter ? 'AND r.spin_date BETWEEN $2 AND $3' : ''}
      GROUP BY p.prize_name
      ORDER BY times_won DESC
    `, hasDateFilter ? [merchantId, start, end] : [merchantId]);

    // Customer Statistics
    const customerStats = await dataSource.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= $2) as new_customers,
        COUNT(DISTINCT f.customer_id) FILTER (WHERE f.customer_id IN (
          SELECT customer_id FROM feedbacks WHERE merchant_id = $1 GROUP BY customer_id HAVING COUNT(*) > 1
        )) as returning_customers
      FROM customers c
      LEFT JOIN feedbacks f ON c.id = f.customer_id
      WHERE f.merchant_id = $1
    `, [merchantId, new Date(new Date().setMonth(new Date().getMonth() - 1))]);

    // Top Customers
    const topCustomers = await dataSource.query(`
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        COUNT(DISTINCT f.id) as total_visits,
        COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'redeemed') as total_coupons_redeemed
      FROM customers c
      LEFT JOIN feedbacks f ON c.id = f.customer_id
      LEFT JOIN coupons cp ON c.id = cp.customer_id AND cp.merchant_id = $1
      WHERE f.merchant_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_visits DESC
      LIMIT 10
    `, [merchantId]);

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
        SUM(credits_deducted) as total_credits_used
      FROM whatsapp_messages
      WHERE merchant_id = $1
      ${hasDateFilter ? 'AND created_at BETWEEN $2 AND $3' : ''}
    `, hasDateFilter ? [merchantId, start, end] : [merchantId]);

    const totalIssued = parseInt(couponStats[0].issued) || 0;
    const totalRedeemed = parseInt(couponStats[0].redeemed) || 0;
    const totalExpired = parseInt(couponStats[0].expired) || 0;
    const totalCreated = parseInt(couponStats[0].created) || 0;
    const totalCoupons = totalCreated + totalIssued + totalRedeemed + totalExpired;
    const totalWhatsappSent = parseInt(couponStats[0].whatsapp_sent) || 0;
    const redemptionRate = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(2) : '0.00';
    
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
    const whatsappCreditsUsed = parseInt(whatsappMessageStats[0]?.total_credits_used) || 0;
    
    const totalReviews = parseInt(feedbackStats[0].total_reviews) || 0;
    const completedRedirects = parseInt(feedbackStats[0].completed_redirects) || 0;
    const redirectCompletionRate = totalReviews > 0 ? ((completedRedirects / totalReviews) * 100).toFixed(2) : '0.00';

    const totalSpins = parseInt(luckyDrawStats[0].total_spins) || 0;
    const claimedPrizes = parseInt(luckyDrawStats[0].claimed_prizes) || 0;
    const claimRate = totalSpins > 0 ? ((claimedPrizes / totalSpins) * 100).toFixed(2) : '0.00';

    const totalCustomers = parseInt(customerStats[0].total_customers) || 0;
    const returningCustomers = parseInt(customerStats[0].returning_customers) || 0;

    return {
      message: 'Dashboard analytics retrieved successfully',
      data: {
        overview: {
          totalCoupons,
          totalCouponsCreated: totalCreated,
          totalCouponsIssued: totalIssued,
          totalCouponsRedeemed: totalRedeemed,
          totalCouponsExpired: totalExpired,

      data: {
        overview: {
          totalCoupons,
          totalCouponsCreated: totalCreated,
          totalCouponsIssued: totalIssued,
          totalCouponsRedeemed: totalRedeemed,
          totalCouponsExpired: totalExpired,
          redemptionRate: parseFloat(redemptionRate),
          whatsappMessagesSent: totalWhatsappSent,
          totalCustomers,
          returningCustomers,
          totalFeedbacks: totalReviews,
          luckyDrawParticipation: totalSpins,
        },
        couponStats: {
          byStatus: {
            created: parseInt(couponStats[0].created) || 0,
            issued: totalIssued,
            redeemed: totalRedeemed,
            expired: parseInt(couponStats[0].expired) || 0,
          },
          byBatch: couponByBatch.map(batch => ({
            batchId: batch.batch_id,
            batchName: batch.batch_name,
            issued: parseInt(batch.issued) || 0,
            redeemed: parseInt(batch.redeemed) || 0,
            expired: parseInt(batch.expired) || 0,
          })),
        },
        feedbackStats: {
          totalReviews,
          presetReviews: parseInt(feedbackStats[0].preset_reviews) || 0,
          customReviews: parseInt(feedbackStats[0].custom_reviews) || 0,
          byPlatform: {
            google: parseInt(feedbackStats[0].google_reviews) || 0,
            facebook: parseInt(feedbackStats[0].facebook_reviews) || 0,
            instagram: parseInt(feedbackStats[0].instagram_reviews) || 0,
            xiaohongshu: parseInt(feedbackStats[0].xiaohongshu_reviews) || 0,
          },
          redirectCompletionRate: parseFloat(redirectCompletionRate),
        },
        luckyDrawStats: {
          totalSpins,
          totalPrizesWon: claimedPrizes,
          claimRate: parseFloat(claimRate),
          prizeDistribution: prizeDistribution.map(prize => ({
            prizeName: prize.prize_name,
            timesWon: parseInt(prize.times_won) || 0,
          })),
        },
        customerStats: {
          newCustomersThisMonth: parseInt(customerStats[0].new_customers) || 0,
          returningCustomersThisMonth: returningCustomers,
          topCustomers: topCustomers.map(customer => ({
            customerId: customer.customer_id,
            customerName: customer.customer_name,
            totalVisits: parseInt(customer.total_visits) || 0,
            totalCouponsRedeemed: parseInt(customer.total_coupons_redeemed) || 0,
          })),
        },
        whatsappStats: {
          totalMessagesSent: totalWhatsappSent,
          couponDeliverySent: totalWhatsappSent, // Approximation - can be refined
          birthdayCouponsSent: biBirthday,
          inactiveRemindersSent: biInactive,
          campaignMessagesSent: biMessages,
          estimatedCost: totalWhatsAppMessages * 0.05, // $0.05 per message estimate
          creditsUsed: whatsappCreditsUsed,
          // UI/BI Breakdown from whatsapp_messages table
          uiMessages: {
            total: uiMessages, // User-initiated messages (feedback, lucky draw, homepage)
            feedbackCoupons: uiFeedback, // Feedback form submissions
            luckyDrawWins: uiLuckydraw, // Lucky draw spin wins
            homepageCoupons: uiHomepage, // Homepage coupon claims
          },
          biMessages: {
            total: biMessages, // Business-initiated messages (campaigns)
            birthdayCampaigns: biBirthday,
            inactiveRecalls: biInactive,
            festivalCampaigns: biFestival,
          },
        },
    
        
      },
    }
  }
}
  }
}
