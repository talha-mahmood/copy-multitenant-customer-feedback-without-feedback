import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository, Between, DataSource } from 'typeorm';
import { MonthlyStatement } from './entities/monthly-statement.entity';
import { CreditLedgerService } from '../credits-ledger/credit-ledger.service';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Admin } from '../admins/entities/admin.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { WhatsAppMessage } from '../whatsapp/entities/whatsapp-message.entity';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MonthlyStatementService {
  constructor(
    @Inject('MONTHLY_STATEMENT_REPOSITORY')
    private monthlyStatementRepository: Repository<MonthlyStatement>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('ADMIN_REPOSITORY')
    private adminRepository: Repository<Admin>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    @Inject('WHATSAPP_MESSAGE_REPOSITORY')
    private whatsappMessageRepository: Repository<WhatsAppMessage>,
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
    private creditLedgerService: CreditLedgerService,
  ) {}

  async generateStatements(year: number, month: number, ownerType?: string, ownerId?: number) {
    const targetYear = year;
    const targetMonth = month;

    // If owner_type and owner_id specified, generate for specific owner
    if (ownerType && ownerId) {
      if (ownerType === 'merchant') {
        const statement = await this.generateMerchantStatement(ownerId, targetYear, targetMonth);
        return {
          message: `Generated statement for merchant ${ownerId}`,
          data: statement,
        };
      } else if (ownerType === 'agent') {
        const statement = await this.generateAgentStatement(ownerId, targetYear, targetMonth);
        return {
          message: `Generated statement for agent ${ownerId}`,
          data: statement,
        };
      }   
      else if (ownerType === 'super_admin') {
        const statement = await this.generateMasterStatement(targetYear, targetMonth);
        return {
          message: `Generated master statement`,
          data: statement,
        };
      }
    }

    // Otherwise, generate for all
    const merchants = await this.merchantRepository.find();
    for (const merchant of merchants) {
      await this.generateMerchantStatement(merchant.id, targetYear, targetMonth);
    }

    const agents = await this.adminRepository.find();
    for (const agent of agents) {
      await this.generateAgentStatement(agent.id, targetYear, targetMonth);
    }

    await this.generateMasterStatement(targetYear, targetMonth);

    return {
      message: `Generated monthly statements for ${targetYear}-${targetMonth}`,
      data: {
        year: targetYear,
        month: targetMonth,
        merchants: merchants.length,
        agents: agents.length,
      },
    };
  }

  async generateAllMonthlyStatements(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    return this.generateStatements(targetYear, targetMonth);
  }

  async generateMerchantStatement(merchantId: number, year: number, month: number) {
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get ledger data
    const ledgers = await this.creditLedgerService.getLedgerForPeriod(
      'merchant',
      merchantId,
      startDate,
      endDate,
    );

    // Get coupon statistics
    const couponStats = await this.getCouponStats(merchantId, startDate, endDate);

    // Get WhatsApp statistics
    const whatsappStats = await this.getWhatsAppStats(merchantId, startDate, endDate);

    // Get opening balances
    const openingBalances = {
      coupon: await this.creditLedgerService.getOpeningBalance('merchant', merchantId, 'coupon', startDate),
      wa_ui: await this.creditLedgerService.getOpeningBalance('merchant', merchantId, 'wa_ui', startDate),
      wa_bi: await this.creditLedgerService.getOpeningBalance('merchant', merchantId, 'wa_bi', startDate),
      paid_ads: await this.creditLedgerService.getOpeningBalance('merchant', merchantId, 'paid_ads', startDate),
    };

    // Get closing balances
    const closingBalances = await this.creditLedgerService.getBalances('merchant', merchantId);

    const statementData = {
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      },
      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        merchant_type: merchant.merchant_type,
      },
      coupons: couponStats,
      whatsapp_credits_used: whatsappStats,
      credits: {
        opening: openingBalances,
        closing: closingBalances.data,
        movements: ledgers,
      },
      ledger: ledgers,
    };

    const statement = this.monthlyStatementRepository.create({
      owner_type: 'merchant',
      owner_id: merchantId,
      year,
      month,
      company_name: merchant.business_name,
      statement_data: statementData,
      generated_at: new Date(),
      status: 'generated',
    });

    const savedStatement = await this.monthlyStatementRepository.save(statement);
    
    // Generate PDF immediately
    const pdfPath = await this.generatePdf(savedStatement);
    savedStatement.pdf_url = pdfPath;
    
    return await this.monthlyStatementRepository.save(savedStatement);
  }

  async generateAgentStatement(agentId: number, year: number, month: number) {
    const agent = await this.adminRepository.findOne({ where: { id: agentId }, relations: ['user'] });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get ledger data
    const ledgers = await this.creditLedgerService.getLedgerForPeriod(
      'agent',
      agentId,
      startDate,
      endDate,
    );

    // Get agent's merchants
    const merchants = await this.merchantRepository.find({
      where: { admin_id: agentId },
    });

    // Calculate revenue dynamically
    const revenue = {
      annual_fee: 0,
      package_income: 0,
      costs_deducted: 0,
      net_profit: 0,
    };

    // Calculate annual subscription fees from merchants (from merchant registration)
    const annualFeeResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE admin_wallet_id IN (
         SELECT id FROM admin_wallets WHERE admin_id = $1
       ) 
       AND type = 'merchant_annual_subscription_commission'
       AND created_at BETWEEN $2 AND $3`,
      [agentId, startDate, endDate]
    );
    revenue.annual_fee = Number(annualFeeResult[0]?.total || 0);

    // Calculate package commission income (from package purchases)
    const packageIncomeResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE admin_wallet_id IN (
         SELECT id FROM admin_wallets WHERE admin_id = $1
       ) 
       AND type = 'merchant_package_commission'
       AND status = 'completed' 
       AND created_at BETWEEN $2 AND $3`,
      [agentId, startDate, endDate]
    );
    revenue.package_income = Number(packageIncomeResult[0]?.total || 0);

    // Calculate agent subscription costs paid to super admin
    const subscriptionCostsResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE admin_wallet_id IN (
         SELECT id FROM admin_wallets WHERE admin_id = $1
       ) 
       AND type = 'agent_subscription_fee'
       AND status = 'completed' 
       AND created_at BETWEEN $2 AND $3`,
      [agentId, startDate, endDate]
    );
    const subscriptionCosts = Number(subscriptionCostsResult[0]?.total || 0);

    ledgers.forEach((ledger) => {
      if (ledger.action === 'deduct' && ledger.amount < 0) {
        revenue.costs_deducted += Math.abs(Number(ledger.amount));
      }
    });

    // Add agent subscription costs to total costs
    revenue.costs_deducted += subscriptionCosts;

    revenue.net_profit = revenue.annual_fee + revenue.package_income - revenue.costs_deducted;

    // Get opening and closing balances
    const openingBalances = {
      coupon: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'coupon', startDate),
      wa_ui: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'wa_ui', startDate),
      wa_bi: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'wa_bi', startDate),
      paid_ads: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'paid_ads', startDate),
    };

    const closingBalances = await this.creditLedgerService.getBalances('agent', agentId);

    // Get commission transactions for detailed breakdown
    const commissionTransactions = await this.dataSource.query(
      `SELECT wt.*, 
              m.business_name as merchant_name,
              (wt.metadata::json->>'merchant_id')::int as merchant_id_from_metadata
       FROM wallet_transactions wt
       LEFT JOIN admin_wallets aw ON wt.admin_wallet_id = aw.id
       LEFT JOIN merchants m ON m.id = (wt.metadata::json->>'merchant_id')::int
       WHERE aw.admin_id = $1
       AND wt.type IN ('merchant_annual_subscription_commission', 'merchant_package_commission')
       AND wt.created_at BETWEEN $2 AND $3
       ORDER BY wt.created_at DESC`,
      [agentId, startDate, endDate]
    );

    // Get merchant details with their package purchases this month
    const merchantDetails = await Promise.all(
      merchants.map(async (merchant) => {
        const packages = await this.dataSource.query(
          `SELECT 
             COUNT(DISTINCT related_object_id) as count, 
             SUM(CASE WHEN action = 'purchase' THEN 
               CAST(metadata::json->>'amount' AS DECIMAL) 
               ELSE 0 END) as total_amount
           FROM credits_ledger
           WHERE owner_type = 'merchant'
           AND owner_id = $1
           AND action = 'purchase'
           AND related_object_type = 'package'
           AND created_at BETWEEN $2 AND $3`,
          [merchant.id, startDate, endDate]
        );
        return {
          id: merchant.id,
          business_name: merchant.business_name,
          merchant_type: merchant.merchant_type,
          created_at: merchant.created_at,
          packages_purchased: parseInt(packages[0]?.count || 0),
          total_spent: parseFloat(packages[0]?.total_amount || 0),
          is_new: new Date(merchant.created_at) >= startDate && new Date(merchant.created_at) <= endDate,
        };
      })
    );

    const statementData = {
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      },
      agent: {
        id: agent.id,
        name: agent.user?.name || 'Agent',
      },
      merchants: {
        total: merchants.length,
        new_this_month: merchants.filter(
          (m) =>
            new Date(m.created_at) >= startDate && new Date(m.created_at) <= endDate,
        ).length,
        details: merchantDetails,
      },
      revenue,
      credits: {
        opening: openingBalances,
        closing: closingBalances.data,
      },
      ledger: ledgers,
      commission_transactions: commissionTransactions,
    };

    const statement = this.monthlyStatementRepository.create({
      owner_type: 'agent',
      owner_id: agentId,
      year,
      month,
      company_name: agent.user?.name || 'Agent',
      statement_data: statementData,
      generated_at: new Date(),
      status: 'generated',
    });

    const savedStatement = await this.monthlyStatementRepository.save(statement);
    
    // Generate PDF immediately
    const pdfPath = await this.generatePdf(savedStatement);
    savedStatement.pdf_url = pdfPath;
    
    return await this.monthlyStatementRepository.save(savedStatement);
  }

  async generateMasterStatement(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get revenue breakdown from super admin wallet transactions only
    const revenueStats = await this.dataSource.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'agent_subscription_fee'), 0) AS agent_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_annual_subscription_commission'), 0) AS annual_merchants_subscription_revenue,
        COALESCE(SUM(amount) FILTER (WHERE type = 'merchant_package_commission'), 0) AS merchants_package_commissions
      FROM wallet_transactions
      WHERE super_admin_wallet_id IS NOT NULL
        AND created_at BETWEEN $1 AND $2
    `, [startDate, endDate]);

    // Get agent statistics
    const agentStats = await this.dataSource.query(`
      SELECT 
        COUNT(*) AS total_agents,
        COUNT(*) FILTER (WHERE u.is_active = TRUE) AS active_agents,
        COUNT(*) FILTER (WHERE u.is_active = FALSE) AS inactive_agents
      FROM admins a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.deleted_at IS NULL
    `);

    // Get merchant statistics for the period
    const merchantStats = await this.dataSource.query(`
      SELECT 
        COUNT(*) AS total_merchants,
        COUNT(*) FILTER (WHERE u.is_active = TRUE) AS active_merchants,
        COUNT(*) FILTER (WHERE u.is_active = FALSE) AS inactive_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'annual') AS annual_merchants,
        COUNT(*) FILTER (WHERE m.merchant_type = 'temporary') AS temporary_merchants,
        COUNT(*) FILTER (WHERE m.created_at BETWEEN $1 AND $2) AS new_merchants
      FROM merchants m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.deleted_at IS NULL
    `, [startDate, endDate]);

    // Get customer and engagement statistics
    const engagementStats = await this.dataSource.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE created_at BETWEEN $1 AND $2) AS new_customers,
        (SELECT COUNT(*) FROM customers) AS total_customers,
        (SELECT COUNT(*) FROM coupons WHERE status = 'issued' AND created_at BETWEEN $1 AND $2) AS coupons_issued,
        (SELECT COUNT(*) FROM coupons WHERE status = 'redeemed' AND created_at BETWEEN $1 AND $2) AS coupons_redeemed,
        (SELECT COUNT(*) FROM feedbacks WHERE created_at BETWEEN $1 AND $2) AS feedbacks_submitted
    `, [startDate, endDate]);

    const statementData = {
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      },
      revenue: {
        agents_subscription_revenue: Number(revenueStats[0].agent_subscription_revenue),
        annual_merchants_subscription_revenue: Number(revenueStats[0].annual_merchants_subscription_revenue),
        merchants_package_commissions: Number(revenueStats[0].merchants_package_commissions),
        total_super_admin_revenue: Number(revenueStats[0].agent_subscription_revenue) + Number(revenueStats[0].annual_merchants_subscription_revenue) + Number(revenueStats[0].merchants_package_commissions),
      },
      agents: {
        total: Number(agentStats[0].total_agents),
        active: Number(agentStats[0].active_agents),
        inactive: Number(agentStats[0].inactive_agents),
      },
      merchants: {
        total: Number(merchantStats[0].total_merchants),
        active: Number(merchantStats[0].active_merchants),
        inactive: Number(merchantStats[0].inactive_merchants),
        annual: Number(merchantStats[0].annual_merchants),
        temporary: Number(merchantStats[0].temporary_merchants),
        new_this_month: Number(merchantStats[0].new_merchants),
      },
      engagement: {
        new_customers: Number(engagementStats[0].new_customers),
        total_customers: Number(engagementStats[0].total_customers),
        coupons_issued: Number(engagementStats[0].coupons_issued),
        coupons_redeemed: Number(engagementStats[0].coupons_redeemed),
        feedbacks_submitted: Number(engagementStats[0].feedbacks_submitted),
      },
    };

    const statement = this.monthlyStatementRepository.create({
      owner_type: 'super_admin',
      owner_id: 1,
      year,
      month,
      company_name: 'QR Review & Coupon SaaS Platform',
      statement_data: statementData,
      generated_at: new Date(),
      status: 'generated',
    });

    const savedStatement = await this.monthlyStatementRepository.save(statement);
    
    // Generate PDF immediately
    const pdfPath = await this.generatePdf(savedStatement);
    savedStatement.pdf_url = pdfPath;
    
    return await this.monthlyStatementRepository.save(savedStatement);
  }

  private async getCouponStats(merchantId: number, startDate: Date, endDate: Date) {
    const coupons = await this.couponRepository.find({
      where: {
        merchant_id: merchantId,
        created_at: Between(startDate, endDate),
      },
    });

    return {
      generated: coupons.length,
      taken: coupons.filter((c) => c.status === 'issued').length,
      redeemed: coupons.filter((c) => c.status === 'redeemed').length,
      expired: coupons.filter((c) => c.status === 'expired').length,
    };
  }

  private async getWhatsAppStats(merchantId: number, startDate: Date, endDate: Date) {
    const messages = await this.whatsappMessageRepository.find({
      where: {
        merchant_id: merchantId,
        created_at: Between(startDate, endDate),
      },
    });

    const uiMessages = messages.filter(m => m.message_type === 'UI');
    const biMessages = messages.filter(m => m.message_type === 'BI');

    return {
      ui_credits_used: uiMessages.reduce((sum, m) => sum + m.credits_deducted, 0),
      ui_success: uiMessages.filter(m => m.status === 'sent' || m.status === 'delivered').length,
      ui_failed: uiMessages.filter(m => m.status === 'failed').length,
      bi_credits_used: biMessages.reduce((sum, m) => sum + m.credits_deducted, 0),
      bi_success: biMessages.filter(m => m.status === 'sent' || m.status === 'delivered').length,
      bi_failed: biMessages.filter(m => m.status === 'failed').length,
      total_credits_used: messages.reduce((sum, m) => sum + m.credits_deducted, 0),
    };
  }

  async findAll(ownerType?: string, ownerId?: number, year?: number, month?: number) {
    const queryBuilder = this.monthlyStatementRepository.createQueryBuilder('statement');

    if (ownerType) {
      queryBuilder.andWhere('statement.owner_type = :ownerType', { ownerType });
    }

    if (ownerId) {
      queryBuilder.andWhere('statement.owner_id = :ownerId', { ownerId });
    }

    if (year) {
      queryBuilder.andWhere('statement.year = :year', { year });
    }

    if (month) {
      queryBuilder.andWhere('statement.month = :month', { month });
    }

    queryBuilder.orderBy('statement.year', 'DESC').addOrderBy('statement.month', 'DESC');

    const statements = await queryBuilder.getMany();

    return {
      message: 'Success',
      data: statements,
    };
  }

  async findOne(id: number) {
    const statement = await this.monthlyStatementRepository.findOne({ where: { id } });
    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return {
      message: 'Success',
      data: statement,
    };
  }

  async downloadPdf(id: number): Promise<string> {
    const statement = await this.monthlyStatementRepository.findOne({ where: { id } });
    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    // Generate PDF if not already generated
    if (!statement.pdf_url) {
      const pdfPath = await this.generatePdf(statement);
      statement.pdf_url = pdfPath;
      statement.viewed_at = new Date();
      statement.status = 'viewed';
      await this.monthlyStatementRepository.save(statement);
    }

    return statement.pdf_url;
  }

  async getAllStatementPdfs(year: number, month: number, ownerType?: string, ownerId?: number) {
    // Build where clause with optional owner_type and owner_id filters
    const whereClause: any = {
      year,
      month,
    };

    // Add owner_type filter if provided
    if (ownerType) {
      whereClause.owner_type = ownerType;
    }

    // Add owner_id filter if provided
    if (ownerId) {
      whereClause.owner_id = ownerId;
    }

    // Get all statements for the specified year and month
    const statements = await this.monthlyStatementRepository.find({
      where: whereClause,
      order: {
        owner_type: 'ASC',
        owner_id: 'ASC',
      },
    });

    if (!statements || statements.length === 0) {
      throw new NotFoundException(`No statements found for ${year}-${month}`);
    }

    // Get base URL for constructing full PDF URLs
    const baseUrl = process.env.APP_URL;

    // Ensure all statements have PDFs generated
    const statementPdfs = await Promise.all(
      statements.map(async (statement) => {
        // Generate PDF if not already generated
        if (!statement.pdf_url) {
          const pdfPath = await this.generatePdf(statement);
          statement.pdf_url = pdfPath;
          statement.viewed_at = new Date();
          statement.status = 'viewed';
          await this.monthlyStatementRepository.save(statement);
        }

        // Fetch owner details for better identification
        let ownerName = 'Unknown';
        if (statement.owner_type === 'merchant') {
          const merchant = await this.merchantRepository.findOne({
            where: { id: statement.owner_id },
            relations: ['user'],
          });
          ownerName = merchant?.user?.name || merchant?.business_name || `Merchant ${statement.owner_id}`;
        } else if (statement.owner_type === 'agent') {
          const agent = await this.adminRepository.findOne({
            where: { id: statement.owner_id },
            relations: ['user'],
          });
          ownerName = agent?.user?.name || `Agent ${statement.owner_id}`;
        } else if (statement.owner_type === 'super_admin') {
          ownerName = 'Platform Admin';
        }

        // Construct full PDF URL
        const fullPdfUrl = statement.pdf_url 
          ? `${baseUrl}/${statement.pdf_url.replace(/^\//, '')}` 
          : null;

        return {
          id: statement.id,
          owner_type: statement.owner_type,
          owner_id: statement.owner_id,
          owner_name: ownerName,
          year: statement.year,
          month: statement.month,
          pdf_url: fullPdfUrl,
          status: statement.status,
          generated_at: statement.generated_at,
        };
      }),
    );

    // Group by owner type
    const groupedStatements = {
      merchants: statementPdfs.filter((s) => s.owner_type === 'merchant'),
      agents: statementPdfs.filter((s) => s.owner_type === 'agent'),
      super_admin: statementPdfs.filter((s) => s.owner_type === 'super_admin'),
    };

    return {
      message: 'Success',
      data: {
        year,
        month,
        total: statementPdfs.length,
        counts: {
          merchants: groupedStatements.merchants.length,
          agents: groupedStatements.agents.length,
          super_admin: groupedStatements.super_admin.length,
        },
        statements: groupedStatements,
        all_statements: statementPdfs,
      },
    };
  }

  private async generatePdf(statement: MonthlyStatement): Promise<string> {
    const fileName = `statement_${statement.owner_type}_${statement.owner_id}_${statement.year}_${statement.month}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'statements');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    const monthStr = `${statement.year}-${String(statement.month).padStart(2, '0')}`;
    
    let pdfBuffer: Buffer;

    // Get ledger data for the statement period
    const startDate = new Date(statement.year, statement.month - 1, 1);
    const endDate = new Date(statement.year, statement.month, 0, 23, 59, 59);
    const ledgers = await this.creditLedgerService.getLedgerForPeriod(
      statement.owner_type,
      statement.owner_id,
      startDate,
      endDate,
    );

    // Generate PDF based on owner type
    if (statement.owner_type === 'merchant') {
      const merchant = await this.merchantRepository.findOne({ where: { id: statement.owner_id } });
      if (!merchant) throw new Error('Merchant not found');
      pdfBuffer = await this.createMerchantPdf(merchant, monthStr, statement.statement_data, ledgers);
    } else if (statement.owner_type === 'agent') {
      const agent = await this.adminRepository.findOne({ where: { id: statement.owner_id }, relations: ['user'] });
      if (!agent) throw new Error('Agent not found');
      pdfBuffer = await this.createAgentPdf(agent, monthStr, statement.statement_data, ledgers);
    } else if (statement.owner_type === 'super_admin') {
      pdfBuffer = await this.createMasterPdf(monthStr, statement.statement_data, ledgers);
    } else {
      throw new Error('Invalid owner type');
    }

    // Write buffer to file
    fs.writeFileSync(filePath, pdfBuffer);

    return filePath;
  }

  private async createMerchantPdf(m: Merchant, month: string, s: any, l: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Header - Company Name and Period
    this.renderStatementHeader(doc, m.business_name, 'MERCHANT MONTHLY STATEMENT', month);

    // Financial Summary Highlight Box
    this.drawSummaryBox(doc, [
      { label: 'COUPON BAL', opening: s.credits.opening.coupon || 0, closing: s.credits.closing.coupon || 0 },
      { label: 'WA-UI BAL', opening: s.credits.opening.wa_ui || 0, closing: s.credits.closing.wa_ui || 0 },
      { label: 'WA-BI BAL', opening: s.credits.opening.wa_bi || 0, closing: s.credits.closing.wa_bi || 0 },
      { label: 'AD-CRED BAL', opening: s.credits.opening.paid_ads || 0, closing: s.credits.closing.paid_ads || 0 },
    ]);
    doc.moveDown(0.5);

    // Account Summary Section
    this.drawSectionHeader(doc, 'CREDIT BALANCES(BANK-STYLE)');
    const balanceData = [
      ['Credit Type', 'Opening Balance', 'Closing Balance'],
      ['Coupon Credits', s.credits.opening.coupon || 0, s.credits.closing.coupon || 0],
      ['WhatsApp UI Credits', s.credits.opening.wa_ui || 0, s.credits.closing.wa_ui || 0],
      ['WhatsApp BI Credits', s.credits.opening.wa_bi || 0, s.credits.closing.wa_bi || 0],
      ['Ad Credits', s.credits.opening.paid_ads || 0, s.credits.closing.paid_ads || 0],
    ];
    this.drawTable(doc, balanceData, [210, 150, 150]);
    doc.moveDown(0.5);

    // Coupon Metrics Section
    this.drawSectionHeader(doc, 'COUPON METRICS');
    const couponData = [
      ['Status', 'Count'],
      ['Generated', s.coupons.generated || 0],
      ['Taken', s.coupons.taken || 0],
      ['Redeemed', s.coupons.redeemed || 0],
      ['Expired/Refunded', s.coupons.expired_refunded || 0],
    ];
    this.drawTable(doc, couponData, [410, 100]);
    doc.moveDown(0.5);

    // WhatsApp Usage Section
    this.drawSectionHeader(doc, 'WHATSAPP USAGE DETAILS');
    const waData = [
      ['Category', 'Success', 'Failed', 'Credits Used'],
      ['User Initiated (UI)', s.whatsapp_credits_used?.ui_success || 0, s.whatsapp_credits_used?.ui_failed || 0, s.whatsapp_credits_used?.ui_credits_used || 0],
      ['Business Initiated (BI)', s.whatsapp_credits_used?.bi_success || 0, s.whatsapp_credits_used?.bi_failed || 0, s.whatsapp_credits_used?.bi_credits_used || 0],
    ];
    this.drawTable(doc, waData, [160, 100, 100, 150]);
    doc.moveDown(0.5);

    // Paid Ads Section - Skip if no ads data
    if (s.ads && s.ads.length > 0) {
      this.drawSectionHeader(doc, 'PAID ADS PURCHASES');
      const adData = [['Date', 'Amount', 'Duration', 'Targeting']];
      s.ads.forEach(ad => {
        const metadata = ad.metadata || {};
        adData.push([
          new Date(ad.date).toLocaleDateString(),
          ad.amount + ' credits',
          metadata.duration || 'N/A',
          metadata.targeting || 'N/A'
        ]);
      });
      this.drawTable(doc, adData, [100, 110, 150, 150]);
      doc.moveDown(0.5);
    }

    // Ledger Snapshot
    this.drawSectionHeader(doc, 'MONTHLY LEDGER SNAPSHOT');
    const ledgerData = [['Date', 'Action', 'Type', 'Change', 'Balance After']];
    l.slice(0, 20).forEach(entry => {
      ledgerData.push([
        new Date(entry.created_at).toLocaleDateString(),
        entry.action.toUpperCase(),
        entry.credit_type.replace(/_/g, ' ').toUpperCase(),
        (entry.amount > 0 ? '+' : '') + entry.amount,
        entry.balance_after
      ]);
    });
    if (l.length > 20) ledgerData.push(['...', '...', '...', '...', '...']);
    this.drawTable(doc, ledgerData, [80, 100, 120, 100, 110]);

    this.renderStatementFooter(doc);

    doc.end();
    return new Promise((res) => doc.on('end', () => res(Buffer.concat(buffers))));
  }

  private async createAgentPdf(a: Admin, month: string, s: any, l: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    this.renderStatementHeader(doc, a.user.name, 'AGENT SETTLEMENT REPORT', month);

    // Performance & Financial Summary Box
    this.drawSummaryBox(doc, [
      { label: 'NEW MERCHANTS', opening: s.merchants.total - s.merchants.new_this_month, closing: s.merchants.total },
      { label: 'SETTLEMENT PROFIT', opening: '-', closing: '$' + (s.revenue.net_profit || 0).toFixed(2) },
    ]);
    doc.moveDown(0.5);

    // Merchant Portfolio Section
    this.drawSectionHeader(doc, 'MERCHANT PORTFOLIO');
    const merchantData = [
      ['Merchant Name', 'Type', 'Packages', 'Total Spent', 'Status'],
    ];
    if (s.merchants.details && s.merchants.details.length > 0) {
      s.merchants.details.forEach(m => {
        merchantData.push([
          m.business_name || 'N/A',
          m.merchant_type || 'annual',
          (m.packages_purchased || 0).toString(),
          '$' + (m.total_spent || 0).toFixed(2),
          m.is_new ? 'NEW' : 'ACTIVE'
        ]);
      });
    } else {
      merchantData.push(['No merchants found', '', '', '', '']);
    }
    this.drawTable(doc, merchantData, [150, 80, 70, 90, 70]);
    doc.moveDown(0.5);

    // Commission Breakdown Section
    this.drawSectionHeader(doc, 'COMMISSION & COST BREAKDOWN');
    const finData = [
      ['Description', 'Debit', 'Credit', 'Balance'],
      ['Annual Fee Income', '-', '$' + (s.revenue.annual_fee || 0).toFixed(2), '-'],
      ['Package Commission Income', '-', '$' + (s.revenue.package_income || 0).toFixed(2), '-'],
      ['System Costs Deducted', '$' + (s.revenue.costs_deducted || 0).toFixed(2), '-', '-'],
      ['NET ACCRUED PROFIT', '-', '-', '$' + (s.revenue.net_profit || 0).toFixed(2)],
    ];
    this.drawTable(doc, finData, [210, 100, 100, 100]);
    doc.moveDown(0.5);

    // Commission Transactions Details
    if (s.commission_transactions && s.commission_transactions.length > 0) {
      this.drawSectionHeader(doc, 'COMMISSION TRANSACTIONS');
      const commissionData = [['Date', 'Merchant', 'Type', 'Amount', 'Status']];
      s.commission_transactions.slice(0, 15).forEach(tx => {
        // Format type: convert underscores to spaces and capitalize words
        const formattedType = (tx.type || '')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        commissionData.push([
          new Date(tx.created_at).toLocaleDateString(),
          tx.merchant_name || '',
          formattedType,
          '$' + parseFloat(tx.amount || 0).toFixed(2),
          tx.status.toUpperCase()
        ]);
      });
      if (s.commission_transactions.length > 15) {
        commissionData.push(['...', '...', '...', '...', '...']);
      }
      this.drawTable(doc, commissionData, [80, 120, 110, 90, 90], 20);
      doc.moveDown(0.5);
    }

    this.renderStatementFooter(doc);

    doc.end();
    return new Promise((res) => doc.on('end', () => res(Buffer.concat(buffers))));
  }

  private async createMasterPdf(month: string, s: any, l: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    this.renderStatementHeader(doc, 'MASTER PLATFORM', 'GLOBAL OPERATIONS STATEMENT', month);

    // Global Metrics Summary Box
    this.drawSummaryBox(doc, [
      { label: 'SUPER ADMIN REVENUE', opening: '-', closing: '$' + ((s.revenue?.total_super_admin_revenue || 0)).toFixed(2) },
      { label: 'AGENTS SUBSCRIPTION REVENUE', opening: '-', closing: '$' + ((s.revenue?.agents_subscription_revenue || 0)).toFixed(2) },
      { label: 'ACTIVE MERCHANTS', opening: '-', closing: (s.merchants?.active || 0).toString() },
    ]);
    doc.moveDown(0.5);

    // Revenue Breakdown - Super Admin Earnings Only
    this.drawSectionHeader(doc, 'PLATFORM REVENUE (SUPER ADMIN)');
    const platformRevenueData = [
      ['Revenue Source', 'Amount'],
      ['Agents Subscription Revenue', '$' + ((s.revenue?.agents_subscription_revenue || 0)).toFixed(2)],
      ['Annual Merchant Subscription Revenue', '$' + ((s.revenue?.annual_merchants_subscription_revenue || 0)).toFixed(2)],
      ['Merchants Package Commissions', '$' + ((s.revenue?.merchants_package_commissions || 0)).toFixed(2)],
      ['Total Super Admin Revenue', '$' + ((s.revenue?.total_super_admin_revenue || 0)).toFixed(2)],
    ];
    this.drawTable(doc, platformRevenueData, [360, 150]);
    doc.moveDown(0.5);

    // Agent Statistics
    this.drawSectionHeader(doc, 'AGENT STATISTICS');
    const agentStatsData = [
      ['Metric', 'Count'],
      ['Total Agents', (s.agents?.total || 0).toString()],
      ['Active Agents', (s.agents?.active || 0).toString()],
      ['Inactive Agents', (s.agents?.inactive || 0).toString()],
    ];
    this.drawTable(doc, agentStatsData, [360, 150]);
    doc.moveDown(0.5);

    // Merchant Statistics
    this.drawSectionHeader(doc, 'MERCHANT STATISTICS');
    const merchantStatsData = [
      ['Metric', 'Count'],
      ['Total Merchants', (s.merchants?.total || 0).toString()],
      ['Active Merchants', (s.merchants?.active || 0).toString()],
      ['Inactive Merchants', (s.merchants?.inactive || 0).toString()],
      ['Annual Subscriptions', (s.merchants?.annual || 0).toString()],
      ['Temporary Merchants', (s.merchants?.temporary || 0).toString()],
      ['New This Month', (s.merchants?.new_this_month || 0).toString()],
    ];
    this.drawTable(doc, merchantStatsData, [360, 150]);
    doc.moveDown(0.5);

    // Customer & Engagement Statistics
    this.drawSectionHeader(doc, 'CUSTOMER & ENGAGEMENT');
    const engagementData = [
      ['Metric', 'Count'],
      ['Total Customers', (s.engagement?.total_customers || 0).toString()],
      ['New Customers This Month', (s.engagement?.new_customers || 0).toString()],
      ['Coupons Issued', (s.engagement?.coupons_issued || 0).toString()],
      ['Coupons Redeemed', (s.engagement?.coupons_redeemed || 0).toString()],
      ['Feedback Submissions', (s.engagement?.feedbacks_submitted || 0).toString()],
    ];
    this.drawTable(doc, engagementData, [360, 150]);
    doc.moveDown(0.5);

    // Platform Ledger Sample (if space allows)
    if (l && l.length > 0) {
      this.drawSectionHeader(doc, 'PLATFORM LEDGER SAMPLE (RECENT TRANSACTIONS)');
      const ledgerData = [['Date', 'Action', 'Type', 'Amount']];
      l.slice(0, 10).forEach(tx => {
        ledgerData.push([
          new Date(tx.created_at).toLocaleDateString(),
          (tx.action || 'N/A').toUpperCase(),
          (tx.credit_type || 'N/A').replace(/_/g, ' ').toUpperCase(),
          (tx.amount > 0 ? '+' : '') + tx.amount
        ]);
      });
      if (l.length > 10) {
        ledgerData.push(['...', '...', '...', '...']);
      }
      this.drawTable(doc, ledgerData, [100, 120, 140, 150]);
    }

    this.renderStatementFooter(doc);

    doc.end();
    return new Promise((res) => doc.on('end', () => res(Buffer.concat(buffers))));
  }

  // --- Premium Styling Helpers ---

  private renderStatementHeader(doc: PDFKit.PDFDocument, companyName: string, type: string, period: string) {
    // Top accent bar
    doc.save();
    doc.rect(0, 0, 612, 40).fill('#1a365d');
    doc.restore();

    doc.y = 55; // Reset Y below accent bar
    doc.fillColor('#1a365d').fontSize(22).font('Helvetica-Bold').text(companyName.toUpperCase(), { align: 'center' });
    doc.fillColor('#4a5568').fontSize(14).font('Helvetica').text(type, { align: 'center' });
    doc.fontSize(10).text(`Statement Period: ${period}`, { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cbd5e0').lineWidth(0.5).stroke();
    doc.moveDown(1.5);
  }

  private drawSummaryBox(doc: PDFKit.PDFDocument, items: { label: string, opening: any, closing: any }[]) {
    const startX = 50;
    const width = 500;
    const boxHeight = 50;
    const itemWidth = width / items.length;
    const topY = doc.y;

    doc.save();
    // Background
    doc.fillColor('#f8fafc').rect(startX, topY, width, boxHeight).fill();
    // Border
    doc.strokeColor('#e2e8f0').lineWidth(1).rect(startX, topY, width, boxHeight).stroke();

    items.forEach((item, i) => {
      const currentX = startX + (i * itemWidth);

      // Labels and Values using fixed offsets from topY
      doc.fillColor('#718096').fontSize(7).font('Helvetica-Bold').text(item.label, currentX, topY + 8, { width: itemWidth, align: 'center' });
      doc.fillColor('#2d3748').fontSize(8).font('Helvetica').text(`Op: ${item.opening}`, currentX, topY + 22, { width: itemWidth, align: 'center' });
      doc.fillColor('#1a365d').fontSize(9).font('Helvetica-Bold').text(`Cl: ${item.closing}`, currentX, topY + 34, { width: itemWidth, align: 'center' });

      // Vertical Dividers
      if (i > 0) {
        doc.moveTo(currentX, topY).lineTo(currentX, topY + boxHeight).strokeColor('#e2e8f0').stroke();
      }
    });
    doc.restore();
    doc.y = topY + boxHeight + 10; // Explicitly move cursor past the box
  }

  private renderStatementFooter(doc: PDFKit.PDFDocument) {
    const bottom = 780; // Absolute bottom safe for A4 (842h)
    doc.save();
    doc.moveTo(50, bottom).lineTo(562, bottom).strokeColor('#cbd5e0').lineWidth(0.5).stroke();
    doc.fillColor('#7a8599').fontSize(7).font('Helvetica').text('This is a computer-generated statement and does not require a signature.', 50, bottom + 5, { width: 512, align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, { width: 512, align: 'center' });
    doc.restore();
  }

  private drawSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    const topY = doc.y;
    doc.save();
    doc.fillColor('#f0f4f8').rect(50, topY, 512, 14).fill();
    doc.fillColor('#2d3748').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), 60, topY + 3);
    doc.restore();
    doc.y = topY + 18;
  }

  private drawTable(doc: PDFKit.PDFDocument, rows: any[][], colWidths: number[], customRowHeight?: number) {
    const startX = 50;
    let startY = doc.y;

    // Determine alignment for each column based on its content (skipping header)
    const colAlignments = colWidths.map((_, colIdx) => {
      if (rows.length <= 1) return 'left';
      const sampleRows = rows.slice(1, 10);
      const isNumericCol = sampleRows.some(row => {
        const cellVal = String(row[colIdx] || '').trim().toLowerCase().replace(' credits', '');
        return cellVal !== '' && (/^[$\d+\-.,]+$/.test(cellVal) || typeof row[colIdx] === 'number');
      });
      return isNumericCol ? 'right' : 'left';
    });

    rows.forEach((row, i) => {
      const isHeader = i === 0;
      const rowHeight = customRowHeight || 15; // Use custom row height if provided

      // Threshold set to 760 to fit more content on Page 1
      if (startY + rowHeight > 760) {
        this.renderStatementFooter(doc);
        doc.addPage();
        startY = 40;
      }

      if (isHeader) {
        doc.fillColor('#2d3748').rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
      } else if (i % 2 === 0) {
        doc.fillColor('#f8fafc').rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
      }

      let currentX = startX;
      row.forEach((cell, cellIdx) => {
        const cellStr = String(cell ?? '');
        const align = colAlignments[cellIdx];

        doc.fillColor(isHeader ? 'white' : '#4a5568')
          .fontSize(isHeader ? 7.5 : 7)
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .text(cellStr, currentX + 5, startY + 4, {
            width: colWidths[cellIdx] - 10,
            align: align as any
          });
        currentX += colWidths[cellIdx];
      });

      if (isHeader) {
        doc.moveTo(startX, startY + rowHeight).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), startY + rowHeight).strokeColor('#2d3748').stroke();
      }

      startY += rowHeight;
    });

    doc.y = startY;
    doc.moveDown(0.2);
  }
}
