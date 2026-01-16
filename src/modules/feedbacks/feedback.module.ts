import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { PresetReviewService } from './preset-review.service';
import { PresetReviewController } from './preset-review.controller';
import { BirthdayMessageService } from './birthday-message.service';
import { DatabaseModule } from 'src/database/database.module';
import { feedbackProviders } from './feedback.provider';
import { presetReviewProvider } from './preset-review.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { merchantSettingProviders } from '../merchant-settings/merchant-setting.provider';
import { couponProvider } from '../coupons/coupon.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, WalletModule, SystemLogModule],
  controllers: [FeedbackController, PresetReviewController],
  providers: [
    FeedbackService,
    PresetReviewService,
    BirthdayMessageService,
    WhatsAppService,
    ...feedbackProviders,
    ...presetReviewProvider,
    ...merchantProviders,
    ...merchantSettingProviders,
    ...couponProvider,
    ...couponBatchProvider,
  ],
  exports: [FeedbackService, PresetReviewService],
})
export class FeedbackModule {}
