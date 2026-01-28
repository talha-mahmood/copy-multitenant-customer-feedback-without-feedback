import { DataSource } from 'typeorm';
import { AgentStripeSetting } from './entities/agent-stripe-setting.entity';

export const agentStripeSettingsProviders = [
    {
        provide: 'AGENT_STRIPE_SETTING_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(AgentStripeSetting),
        inject: ['DATA_SOURCE'],
    },
];
