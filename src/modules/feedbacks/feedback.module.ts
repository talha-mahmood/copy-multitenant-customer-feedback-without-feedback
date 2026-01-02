import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { PresetReviewService } from './preset-review.service';
import { PresetReviewController } from './preset-review.controller';
import { DatabaseModule } from 'src/database/database.module';
import { feedbackProviders } from './feedback.provider';
import { presetReviewProvider } from './preset-review.provider';
import { merchantProviders } from '../merchants/merchant.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [FeedbackController, PresetReviewController],
  providers: [
    FeedbackService,
    PresetReviewService,
    ...feedbackProviders,
    ...presetReviewProvider,
    ...merchantProviders,
  ],
  exports: [FeedbackService, PresetReviewService],
})
export class FeedbackModule {}
