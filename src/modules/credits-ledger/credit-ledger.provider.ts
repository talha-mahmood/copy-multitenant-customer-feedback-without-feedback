import { DataSource } from 'typeorm';
import { CreditsLedger } from '../wallets/entities/credits-ledger.entity';

export const creditLedgerProviders = [
  {
    provide: 'CREDIT_LEDGER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CreditsLedger),
    inject: ['DATA_SOURCE'],
  },
];
