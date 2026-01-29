import { Module } from '@nestjs/common';
import { FinanceViewerService } from './finance-viewer.service';
import { FinanceViewerController } from './finance-viewer.controller';
import { DatabaseModule } from 'src/database/database.module';
import { financeViewerProviders } from './finance-viewer.provider';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  controllers: [FinanceViewerController],
  providers: [FinanceViewerService, ...financeViewerProviders],
  exports: [FinanceViewerService, ...financeViewerProviders],
})
export class FinanceViewerModule {}
