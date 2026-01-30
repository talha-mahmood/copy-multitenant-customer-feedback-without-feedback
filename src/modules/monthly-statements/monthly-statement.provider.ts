import { DataSource } from 'typeorm';
import { MonthlyStatement } from './entities/monthly-statement.entity';

export const monthlyStatementProviders = [
  {
    provide: 'MONTHLY_STATEMENT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(MonthlyStatement),
    inject: ['DATA_SOURCE'],
  },
];
