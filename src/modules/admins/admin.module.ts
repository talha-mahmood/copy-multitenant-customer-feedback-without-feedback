import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseModule } from 'src/database/database.module';
import { adminProviders } from './admin.provider';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';
import { ApprovalModule } from '../approvals/approval.module';
import { EncryptionHelper } from 'src/common/helpers/encryption-helper';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    DatabaseModule,
    WalletModule,
    SystemLogModule,
    ApprovalModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, ...adminProviders, EncryptionHelper],
  exports: [AdminService, 'ADMIN_REPOSITORY'],
})
export class AdminModule { }
