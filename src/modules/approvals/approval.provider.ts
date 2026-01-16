import { DataSource } from 'typeorm';
import { Approval } from './entities/approval.entity';

export const approvalProviders = [
    {
        provide: 'APPROVAL_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Approval),
        inject: ['DATA_SOURCE'],
    },
];
