import { DataSource } from 'typeorm';
import { ScheduledCampaign } from './entities/scheduled-campaign.entity';

export const scheduledCampaignProviders = [
  {
    provide: 'SCHEDULED_CAMPAIGN_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ScheduledCampaign),
    inject: ['DATA_SOURCE'],
  },
];
