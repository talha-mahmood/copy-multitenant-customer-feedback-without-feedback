import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { approvalProviders } from './approval.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ApprovalController],
    providers: [...approvalProviders, ApprovalService],
    exports: [ApprovalService],
})
export class ApprovalModule { }
