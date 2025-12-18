import { DataSource } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Customer } from '../customers/entities/customer.entity';

export const feedbackProviders = [
  {
    provide: 'FEEDBACK_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Feedback),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'CUSTOMER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Customer),
    inject: ['DATA_SOURCE'],
  },
];
