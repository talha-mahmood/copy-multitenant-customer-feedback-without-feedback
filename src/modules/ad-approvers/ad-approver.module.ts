import { Module } from '@nestjs/common';
import { AdApproverService } from './ad-approver.service';
import { AdApproverController } from './ad-approver.controller';
import { DatabaseModule } from 'src/database/database.module';
import { adApproverProviders } from './ad-approver.provider';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  controllers: [AdApproverController],
  providers: [AdApproverService, ...adApproverProviders],
  exports: [AdApproverService, ...adApproverProviders],
})
export class AdApproverModule {}
