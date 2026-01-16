import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { walletProviders } from './wallet.provider';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  providers: [...walletProviders, WalletService],
  controllers: [WalletController],
  exports: [...walletProviders, WalletService],
})
export class WalletModule {}
