import { DataSource } from 'typeorm';
import { MonthlyStatement } from './entities/monthly-statement.entity';
import { WhatsAppMessage } from '../whatsapp/entities/whatsapp-message.entity';

export const monthlyStatementProviders = [
  {
    provide: 'MONTHLY_STATEMENT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(MonthlyStatement),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'WHATSAPP_MESSAGE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(WhatsAppMessage),
    inject: ['DATA_SOURCE'],
  },
];
