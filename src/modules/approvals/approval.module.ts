import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalExpiryCronService } from './approval-expiry-cron.service';
import { approvalProviders } from './approval.provider';
import { DatabaseModule } from 'src/database/database.module';
import { merchantProviders } from '../merchants/merchant.provider';
import { merchantSettingProviders } from '../merchant-settings/merchant-setting.provider';

@Module({
    imports: [DatabaseModule],
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
