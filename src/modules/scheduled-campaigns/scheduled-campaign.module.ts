import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { scheduledCampaignProviders } from './scheduled-campaign.provider';
import { ScheduledCampaignService } from './scheduled-campaign.service';
import { ScheduledCampaignController } from './scheduled-campaign.controller';
import { customerProviders } from '../customers/customer.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { couponProvider } from '../coupons/coupon.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';
import { feedbackProviders } from '../feedbacks/feedback.provider';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [
    DatabaseModule,
    WhatsAppModule,
    WalletModule,
    SystemLogModule,
  ],
  controllers: [ScheduledCampaignController],
  providers: [
    ...scheduledCampaignProviders,
    ...customerProviders,
    ...merchantProviders,
    ...couponProvider,
    ...couponBatchProvider,
    ...feedbackProviders,
    ScheduledCampaignService,
  ],
  exports: [ScheduledCampaignService, ...scheduledCampaignProviders],
})
export class ScheduledCampaignModule {}
