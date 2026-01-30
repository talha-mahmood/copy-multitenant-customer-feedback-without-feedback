import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { walletProviders } from './wallet.provider';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { SystemLogModule } from '../system-logs/system-log.module';
import { CreditLedgerModule } from '../credits-ledger/credit-ledger.module';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { SuperAdminSettingsModule } from '../super-admin-settings/super-admin-settings.module';

@Module({
  imports: [DatabaseModule, SystemLogModule, SuperAdminSettingsModule, CreditLedgerModule],
  providers: [...walletProviders, WalletService, RolesGuard, Reflector],
  controllers: [WalletController],
  exports: [...walletProviders, WalletService],
})
export class WalletModule {}
