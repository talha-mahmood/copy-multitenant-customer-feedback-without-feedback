import { Injectable, Inject } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { MonthlyStatement } from './entities/monthly-statement.entity';
import { CreditLedgerService } from '../credits-ledger/credit-ledger.service';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Admin } from '../admins/entities/admin.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
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
    private creditLedgerService: CreditLedgerService,
  ) {}

  async generateAllMonthlyStatements(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth()); // Previous month

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
      whatsapp: whatsappStats,
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

    // Calculate revenue
    const revenue = {
      annual_fee: 0,
      package_income: 0,
      costs_deducted: 0,
      net_profit: 0,
    };

    ledgers.forEach((ledger) => {
      if (ledger.action === 'purchase' && ledger.amount > 0) {
        revenue.package_income += Number(ledger.amount);
      } else if (ledger.action === 'deduct' && ledger.amount < 0) {
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

    // Get platform statistics
    const totalRevenue = allLedgers
      .filter((l) => l.action === 'purchase' && l.amount > 0)
      .reduce((sum, l) => sum + Number(l.amount), 0);

    const statementData = {
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
      },
      platform: {
        total_revenue: totalRevenue,
        total_whatsapp_ui: 0,
        total_whatsapp_bi: 0,
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
    // This would need to query WhatsApp message logs when implemented
    return {
      ui_count: 0,
      ui_success: 0,
      ui_failed: 0,
      bi_count: 0,
      bi_success: 0,
      bi_failed: 0,
      total_credits_used: 0,
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
      throw new Error('Statement not found');
    }

    return {
      message: 'Success',
      data: statement,
    };
  }

  async downloadPdf(id: number): Promise<string> {
    const statement = await this.monthlyStatementRepository.findOne({ where: { id } });
    if (!statement) {
      throw new Error('Statement not found');
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
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `statement_${statement.owner_type}_${statement.owner_id}_${statement.year}_${statement.month}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'statements');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(statement.company_name, { align: 'center' });
    doc.fontSize(16).text('Monthly Statement', { align: 'center' });
    doc.fontSize(12).text(`Period: ${statement.year}-${String(statement.month).padStart(2, '0')}`, {
      align: 'center',
    });
    doc.moveDown();

    // Content based on owner type
    if (statement.owner_type === 'merchant') {
      this.addMerchantContent(doc, statement.statement_data);
    } else if (statement.owner_type === 'agent') {
      this.addAgentContent(doc, statement.statement_data);
    } else if (statement.owner_type === 'master') {
      this.addMasterContent(doc, statement.statement_data);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private addMerchantContent(doc: any, data: any) {
    doc.fontSize(14).text('Coupon Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Generated: ${data.coupons.generated}`);
    doc.text(`Taken: ${data.coupons.taken}`);
    doc.text(`Redeemed: ${data.coupons.redeemed}`);
    doc.text(`Expired: ${data.coupons.expired}`);
    doc.moveDown();

    doc.fontSize(14).text('WhatsApp Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`UI Messages: ${data.whatsapp.ui_count} (Success: ${data.whatsapp.ui_success})`);
    doc.text(`BI Messages: ${data.whatsapp.bi_count} (Success: ${data.whatsapp.bi_success})`);
    doc.text(`Total Credits Used: ${data.whatsapp.total_credits_used}`);
    doc.moveDown();

    doc.fontSize(14).text('Credit Balances', { underline: true });
    doc.fontSize(10);
    doc.text(`Coupon Credits: Opening ${data.credits.opening.coupon} → Closing ${data.credits.closing.coupon}`);
    doc.text(`WhatsApp UI Credits: Opening ${data.credits.opening.wa_ui} → Closing ${data.credits.closing.wa_ui}`);
    doc.text(`WhatsApp BI Credits: Opening ${data.credits.opening.wa_bi} → Closing ${data.credits.closing.wa_bi}`);
  }

  private addAgentContent(doc: any, data: any) {
    doc.fontSize(14).text('Merchant Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Merchants: ${data.merchants.total}`);
    doc.text(`New This Month: ${data.merchants.new_this_month}`);
    doc.moveDown();

    doc.fontSize(14).text('Revenue Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Annual Fee Income: $${data.revenue.annual_fee}`);
    doc.text(`Package Income: $${data.revenue.package_income}`);
    doc.text(`Costs Deducted: $${data.revenue.costs_deducted}`);
    doc.text(`Net Profit: $${data.revenue.net_profit}`);
    doc.moveDown();

    doc.fontSize(14).text('Wallet Balances', { underline: true });
    doc.fontSize(10);
    doc.text(`Coupon Credits: Opening ${data.credits.opening.coupon} → Closing ${data.credits.closing.coupon}`);
    doc.text(`WhatsApp UI Credits: Opening ${data.credits.opening.wa_ui} → Closing ${data.credits.closing.wa_ui}`);
    doc.text(`WhatsApp BI Credits: Opening ${data.credits.opening.wa_bi} → Closing ${data.credits.closing.wa_bi}`);
  }

  private addMasterContent(doc: any, data: any) {
    doc.fontSize(14).text('Platform Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Revenue: $${data.platform.total_revenue}`);
    doc.text(`Total WhatsApp UI: ${data.platform.total_whatsapp_ui}`);
    doc.text(`Total WhatsApp BI: ${data.platform.total_whatsapp_bi}`);
  }
}
