import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { MonthlyStatementService } from './monthly-statement.service';
import { MonthlyStatementController } from './monthly-statement.controller';
import { monthlyStatementProviders } from './monthly-statement.provider';
import { StatementCronService } from './statement-cron.service';
import { CreditLedgerModule } from '../credits-ledger/credit-ledger.module';
import { merchantProviders } from '../merchants/merchant.provider';
import { adminProviders } from '../admins/admin.provider';
import { couponProvider } from '../coupons/coupon.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';

@Module({
  imports: [DatabaseModule, CreditLedgerModule],
  controllers: [MonthlyStatementController],
  providers: [
    ...monthlyStatementProviders,
    ...merchantProviders,
    ...adminProviders,
    ...couponProvider,
    ...couponBatchProvider,
    MonthlyStatementService,
    StatementCronService,
  ],
  exports: [MonthlyStatementService],
})
export class MonthlyStatementModule {}
