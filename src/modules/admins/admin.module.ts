import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseModule } from 'src/database/database.module';
import { adminProviders } from './admin.provider';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';
import { ApprovalModule } from '../approvals/approval.module';

@Module({
  imports: [DatabaseModule, WalletModule, SystemLogModule, ApprovalModule],
  controllers: [AdminController],
  providers: [AdminService, ...adminProviders],
  exports: [AdminService, 'ADMIN_REPOSITORY'],
})
export class AdminModule { }
