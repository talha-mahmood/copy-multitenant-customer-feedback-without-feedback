import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { DatabaseModule } from '../../database/database.module';
import { whatsappProviders } from './whatsapp.provider';
import { walletProviders } from '../wallets/wallet.provider';
import { merchantProviders } from '../merchants/merchant.provider';

@Module({
  imports: [DatabaseModule],
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
