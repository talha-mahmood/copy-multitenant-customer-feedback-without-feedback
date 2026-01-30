import { Injectable, Inject } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { CreditsLedger } from '../wallets/entities/credits-ledger.entity';
import { CreateCreditLedgerDto } from './dto/create-credit-ledger.dto';

@Injectable()
export class CreditLedgerService {
  constructor(
    @Inject('CREDIT_LEDGER_REPOSITORY')
    private creditLedgerRepository: Repository<CreditsLedger>,
  ) {}

  async create(createCreditLedgerDto: CreateCreditLedgerDto): Promise<CreditsLedger> {
    const ledger = this.creditLedgerRepository.create({
      ...createCreditLedgerDto,
      balance_before: createCreditLedgerDto.balance_after - createCreditLedgerDto.amount,
      metadata: JSON.stringify(createCreditLedgerDto.metadata || {}),
    });
    return await this.creditLedgerRepository.save(ledger);
  }

  async findAll(
    ownerType?: string,
    ownerId?: number,
    creditType?: string,
    page: number = 1,
    pageSize: number = 50,
  ) {
    const queryBuilder = this.creditLedgerRepository.createQueryBuilder('ledger');

    if (ownerType) {
      queryBuilder.andWhere('ledger.owner_type = :ownerType', { ownerType });
    }

    if (ownerId) {
      queryBuilder.andWhere('ledger.owner_id = :ownerId', { ownerId });
    }

    if (creditType) {
      queryBuilder.andWhere('ledger.credit_type = :creditType', { creditType });
    }

    queryBuilder
      .orderBy('ledger.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [ledgers, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Success',
      data: ledgers,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getBalances(ownerType: string, ownerId: number) {
    const ledgers = await this.creditLedgerRepository.find({
      where: { owner_type: ownerType, owner_id: ownerId },
      order: { created_at: 'DESC' },
    });

    const balances = {
      coupon: 0,
      wa_ui: 0,
      wa_bi: 0,
    };

    // Get latest balance for each credit type
    const couponLedger = ledgers.find((l) => l.credit_type === 'coupon');
    const waUiLedger = ledgers.find((l) => l.credit_type === 'wa_ui');
    const waBiLedger = ledgers.find((l) => l.credit_type === 'wa_bi');

    if (couponLedger) balances.coupon = Number(couponLedger.balance_after);
    if (waUiLedger) balances.wa_ui = Number(waUiLedger.balance_after);
    if (waBiLedger) balances.wa_bi = Number(waBiLedger.balance_after);

    return {
      message: 'Success',
      data: balances,
    };
  }

  async getLedgerForPeriod(
    ownerType: string,
    ownerId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const ledgers = await this.creditLedgerRepository.find({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        created_at: Between(startDate, endDate),
      },
      order: { created_at: 'ASC' },
    });

    return ledgers;
  }

  async getOpeningBalance(
    ownerType: string,
    ownerId: number,
    creditType: string,
    beforeDate: Date,
  ): Promise<number> {
    const ledger = await this.creditLedgerRepository.findOne({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        credit_type: creditType,
      },
      order: { created_at: 'DESC' },
    });

    if (!ledger) return 0;

    // Find the balance just before the start date
    const previousLedgers = await this.creditLedgerRepository.find({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        credit_type: creditType,
      },
      order: { created_at: 'DESC' },
    });

    const beforeDateLedger = previousLedgers.find(
      (l) => new Date(l.created_at) < beforeDate,
    );

    return beforeDateLedger ? Number(beforeDateLedger.balance_after) : 0;
  }
}
