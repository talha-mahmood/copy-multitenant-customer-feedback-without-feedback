import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DatabaseModule } from 'src/database/database.module';
import { analyticsProviders } from './analytics.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ...analyticsProviders],
  exports: [AnalyticsService, 'MERCHANT_ANALYTICS_REPOSITORY'],
})
export class AnalyticsModule {}
