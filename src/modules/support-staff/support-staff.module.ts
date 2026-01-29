import { Module } from '@nestjs/common';
import { SupportStaffService } from './support-staff.service';
import { SupportStaffController } from './support-staff.controller';
import { DatabaseModule } from 'src/database/database.module';
import { supportStaffProviders } from './support-staff.provider';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  controllers: [SupportStaffController],
  providers: [SupportStaffService, ...supportStaffProviders],
  exports: [SupportStaffService, ...supportStaffProviders],
})
export class SupportStaffModule {}
