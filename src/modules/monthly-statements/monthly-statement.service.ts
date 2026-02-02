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

  async generateAllMonthlyStatements(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    // If month provided, use it (1-12). Otherwise use current month+1 (getMonth is 0-11)
    const targetMonth = month ?? now.getMonth() + 1;

    // Generate for all merchants
    const merchants = await this.merchantRepository.find();
    for (const merchant of merchants) {
      await this.generateMerchantStatement(merchant.id, targetYear, targetMonth);
    }

    // Generate for all agents
    const agents = await this.adminRepository.find();
    for (const agent of agents) {
      await this.generateAgentStatement(agent.id, targetYear, targetMonth);
    }

    // Generate master statement
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

  async generateMerchantStatement(merchantId: number, year: number, month: number) {
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    // Check if statement already exists
    const existing = await this.monthlyStatementRepository.findOne({
      where: {
        owner_type: 'merchant',
        owner_id: merchantId,
        year,
        month,
      },
    });

    if (existing) {
      return existing;
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

    return await this.monthlyStatementRepository.save(statement);
  }

  async generateAgentStatement(agentId: number, year: number, month: number) {
    const agent = await this.adminRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Check if statement already exists
    const existing = await this.monthlyStatementRepository.findOne({
      where: {
        owner_type: 'agent',
        owner_id: agentId,
        year,
        month,
      },
    });

    if (existing) {
      return existing;
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

    // Calculate annual subscription fees from merchants
    const annualMerchants = merchants.filter(m => m.merchant_type === 'annual');
    // Get wallet transactions for commission income
    const walletTransactions = await this.dataSource.query(
      `SELECT SUM(amount) as total FROM wallet_transactions 
       WHERE admin_wallet_id IN (
         SELECT id FROM admin_wallets WHERE admin_id = $1
       ) 
       AND type = 'commission' 
       AND created_at BETWEEN $2 AND $3`,
      [agentId, startDate, endDate]
    );
    revenue.annual_fee = Number(walletTransactions[0]?.total || 0);

    // Calculate package income from commission transactions
    const packageIncomeResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE admin_wallet_id IN (
         SELECT id FROM admin_wallets WHERE admin_id = $1
       ) 
       AND type = 'commission' 
       AND status = 'completed' 
       AND created_at BETWEEN $2 AND $3`,
      [agentId, startDate, endDate]
    );
    revenue.package_income = Number(packageIncomeResult[0]?.total || 0);

    ledgers.forEach((ledger) => {
      if (ledger.action === 'deduct' && ledger.amount < 0) {
        revenue.costs_deducted += Math.abs(Number(ledger.amount));
      }
    });

    revenue.net_profit = revenue.annual_fee + revenue.package_income - revenue.costs_deducted;

    // Get opening and closing balances
    const openingBalances = {
      coupon: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'coupon', startDate),
      wa_ui: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'wa_ui', startDate),
      wa_bi: await this.creditLedgerService.getOpeningBalance('agent', agentId, 'wa_bi', startDate),
    };

    const closingBalances = await this.creditLedgerService.getBalances('agent', agentId);

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
      },
      revenue,
      credits: {
        opening: openingBalances,
        closing: closingBalances.data,
      },
      ledger: ledgers,
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

    return await this.monthlyStatementRepository.save(statement);
  }

  async generateMasterStatement(year: number, month: number) {
    // Check if statement already exists
    const existing = await this.monthlyStatementRepository.findOne({
      where: {
        owner_type: 'master',
        owner_id: 1,
        year,
        month,
      },
    });

    if (existing) {
      return existing;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all ledgers for the period
    const allLedgers = await this.creditLedgerService.getLedgerForPeriod(
      'master',
      1,
      startDate,
      endDate,
    );

    // Get platform statistics from actual data
    const totalRevenue = allLedgers
      .filter((l) => l.action === 'purchase' && l.amount > 0)
      .reduce((sum, l) => sum + Number(l.amount), 0);

    // Calculate WhatsApp credits usage from ledger
    const whatsappUIUsage = allLedgers
      .filter((l) => l.credit_type === 'wa_ui' && l.action === 'deduct')
      .reduce((sum, l) => sum + Math.abs(Number(l.amount)), 0);

    const whatsappBIUsage = allLedgers
      .filter((l) => l.credit_type === 'wa_bi' && l.action === 'deduct')
      .reduce((sum, l) => sum + Math.abs(Number(l.amount)), 0);

    const statementData = {
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      },
      platform: {
        total_revenue: totalRevenue,
        total_whatsapp_ui: whatsappUIUsage,
        total_whatsapp_bi: whatsappBIUsage,
      },
      ledger: allLedgers,
    };

    const statement = this.monthlyStatementRepository.create({
      owner_type: 'master',
      owner_id: 1,
      year,
      month,
      company_name: 'QR Review & Coupon SaaS Platform',
      statement_data: statementData,
      generated_at: new Date(),
      status: 'generated',
    });

    return await this.monthlyStatementRepository.save(statement);
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
    } else if (statement.owner_type === 'master') {
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

    // Get wallet opening/closing from credits (agent uses credits ledger)
    const openingTotal = (s.credits.opening.coupon || 0) + (s.credits.opening.wa_ui || 0) + (s.credits.opening.wa_bi || 0);
    const closingTotal = (s.credits.closing.coupon || 0) + (s.credits.closing.wa_ui || 0) + (s.credits.closing.wa_bi || 0);

    // Performance & Financial Summary Box
    this.drawSummaryBox(doc, [
      { label: 'NEW MERCHANTS', opening: '-', closing: s.merchants.new_this_month || 0 },
      { label: 'SETTLEMENT PROFIT', opening: '-', closing: '$' + (s.revenue.net_profit || 0).toFixed(2) },
      { label: 'TOTAL CREDITS', opening: openingTotal, closing: closingTotal },
    ]);
    doc.moveDown(0.5);

    // Financial Details
    this.drawSectionHeader(doc, 'COMMISSION & COST BREAKDOWN');
    const finData = [
      ['Description', 'Debit', 'Credit', 'Balance'],
      ['Opening Credits', '', '', openingTotal.toString()],
      ['Annual Fee Income', '', '$' + (s.revenue.annual_fee || 0).toFixed(2), ''],
      ['Package Commission Income', '', '$' + (s.revenue.package_income || 0).toFixed(2), ''],
      ['System Costs Deducted', '$' + (s.revenue.costs_deducted || 0).toFixed(2), '', ''],
      ['NET ACCRUED PROFIT', '', '', '$' + (s.revenue.net_profit || 0).toFixed(2)],
    ];
    this.drawTable(doc, finData, [210, 100, 100, 100]);
    doc.moveDown(0.5);

    // Ledger Details
    this.drawSectionHeader(doc, 'DETAILED LEDGER ENTRIES');
    const ledgerData = [['Date', 'Description', 'Type', 'Amount', 'Balance after']];
    l.slice(0, 30).forEach(tx => {
      ledgerData.push([
        new Date(tx.created_at).toLocaleDateString(),
        (tx.description || '').substring(0, 35),
        (tx.action || 'N/A').toUpperCase(),
        (tx.amount > 0 ? '+' : '') + tx.amount,
        tx.balance_after || 'N/A'
      ]);
    });
    if (l.length > 30) ledgerData.push(['...', '...', '...', '...', '...']);
    this.drawTable(doc, ledgerData, [80, 160, 80, 90, 100]);

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
      { label: 'TOTAL REVENUE', opening: '-', closing: '$' + (s.platform.total_revenue || 0).toFixed(2) },
      { label: 'WA-UI USAGE', opening: '-', closing: (s.platform.total_whatsapp_ui || 0) + ' credits' },
      { label: 'WA-BI USAGE', opening: '-', closing: (s.platform.total_whatsapp_bi || 0) + ' credits' },
    ]);
    doc.moveDown(0.5);

    // Platform Summary
    this.drawSectionHeader(doc, 'FINANCIAL OVERVIEW');
    const finData = [
      ['Metric', 'Amount'],
      ['Total Platform Revenue', '$' + (s.platform.total_revenue || 0).toFixed(2)],
      ['WhatsApp UI Credits Used', (s.platform.total_whatsapp_ui || 0).toString()],
      ['WhatsApp BI Credits Used', (s.platform.total_whatsapp_bi || 0).toString()],
    ];
    this.drawTable(doc, finData, [360, 150]);
    doc.moveDown(0.5);

    // Top Agents - Skip if no data
    if (s.topAgents && s.topAgents.length > 0) {
      this.drawSectionHeader(doc, 'TOP PERFORMING AGENTS');
      const agentData = [['Agent Name', 'Merchants', 'Total Commission Generated']];
      s.topAgents.forEach(a => {
        agentData.push([a.name, a.merchants, '$' + parseFloat(a.earnings).toFixed(2)]);
      });
      this.drawTable(doc, agentData, [260, 100, 150]);
      doc.moveDown(0.5);
    }

    // Country Distribution - Skip if no data
    if (s.countryDistribution && s.countryDistribution.length > 0) {
      this.drawSectionHeader(doc, 'GLOBAL FOOTPRINT (SAMPLED)');
      const geoData = [['Country', 'Merchant Count']];
      s.countryDistribution.slice(0, 5).forEach(c => {
        geoData.push([c.country || 'International', c.count]);
      });
      this.drawTable(doc, geoData, [360, 150]);
      doc.moveDown(0.5);
    }

    // Ledger Overview
    this.drawSectionHeader(doc, 'PLATFORM LEDGER OVERVIEW (SAMPLED)');
    const ledgerData = [['Date', 'Action', 'Credit Type', 'Amount']];
    l.slice(0, 20).forEach(tx => {
      ledgerData.push([
        new Date(tx.created_at).toLocaleDateString(),
        (tx.action || 'N/A').toUpperCase(),
        (tx.credit_type || 'N/A').toUpperCase(),
        (tx.amount > 0 ? '+' : '') + tx.amount
      ]);
    });
    this.drawTable(doc, ledgerData, [100, 120, 140, 150]);

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

  private drawTable(doc: PDFKit.PDFDocument, rows: any[][], colWidths: number[]) {
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
      const rowHeight = 15; // Even tighter rows

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
