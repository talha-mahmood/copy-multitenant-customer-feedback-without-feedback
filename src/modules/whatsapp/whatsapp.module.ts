import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { DatabaseModule } from '../../database/database.module';
import { SystemLogModule } from '../system-logs/system-log.module';
import { whatsappProviders } from './whatsapp.provider';
import { walletProviders } from '../wallets/wallet.provider';
import { merchantProviders } from '../merchants/merchant.provider';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  controllers: [WhatsAppController],
  providers: [
    ...whatsappProviders,
    ...walletProviders,
    ...merchantProviders,
    WhatsAppService,
  ],
  exports: [
    ...whatsappProviders,
    ...walletProviders,
    ...merchantProviders,
    WhatsAppService,
  ],
})
export class WhatsAppModule {}
