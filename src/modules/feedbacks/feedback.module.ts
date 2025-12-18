import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DatabaseModule } from 'src/database/database.module';
import { feedbackProviders } from './feedback.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, ...feedbackProviders],
  exports: [FeedbackService],
})
export class FeedbackModule {}
