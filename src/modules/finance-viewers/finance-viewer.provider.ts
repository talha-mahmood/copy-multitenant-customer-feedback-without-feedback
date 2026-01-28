import { DataSource } from 'typeorm';
import { FinanceViewer } from './entities/finance-viewer.entity';

export const financeViewerProviders = [
  {
    provide: 'FINANCE_VIEWER_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FinanceViewer),
    inject: ['DATA_SOURCE'],
  },
];
