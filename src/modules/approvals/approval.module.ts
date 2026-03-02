import { Module, forwardRef } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalExpiryCronService } from './approval-expiry-cron.service';
import { approvalProviders } from './approval.provider';
import { DatabaseModule } from 'src/database/database.module';
import { merchantProviders } from '../merchants/merchant.provider';
import { merchantSettingProviders } from '../merchant-settings/merchant-setting.provider';
import { WalletModule } from '../wallets/wallet.module';
import { SuperAdminSettingsModule } from '../super-admin-settings/super-admin-settings.module';

@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => WalletModule),
        SuperAdminSettingsModule,
    ],
    controllers: [ApprovalController],
    providers: [
        ...approvalProviders,
        ...merchantProviders,
        ...merchantSettingProviders,
        ApprovalService,
        ApprovalExpiryCronService,
    ],
    exports: [ApprovalService],
})
export class ApprovalModule { }
