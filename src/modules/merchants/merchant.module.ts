import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { DatabaseModule } from 'src/database/database.module';
import { merchantProviders } from './merchant.provider';
import { WalletModule } from '../wallets/wallet.module';
import { MerchantSettingModule } from '../merchant-settings/merchant-setting.module';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, WalletModule, MerchantSettingModule, SystemLogModule],
  controllers: [MerchantController],
  providers: [MerchantService, ...merchantProviders],
  exports: [MerchantService],
})
export class MerchantModule {}
