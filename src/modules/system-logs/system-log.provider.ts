import { DataSource } from 'typeorm';
import { SystemLog } from './entities/system-log.entity';

export const systemLogProviders = [
  {
    provide: 'SYSTEM_LOG_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SystemLog),
    inject: ['DATA_SOURCE'],
  },
];
