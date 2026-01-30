import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CreditLedgerService } from './credit-ledger.service';
import { CreditLedgerController } from './credit-ledger.controller';
import { creditLedgerProviders } from './credit-ledger.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [CreditLedgerController],
  providers: [...creditLedgerProviders, CreditLedgerService],
  exports: [CreditLedgerService],
})
export class CreditLedgerModule {}
