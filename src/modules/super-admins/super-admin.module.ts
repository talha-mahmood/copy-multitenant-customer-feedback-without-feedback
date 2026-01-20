import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { DatabaseModule } from 'src/database/database.module';
import { superAdminProviders } from './super-admin.provider';
import { WalletModule } from '../wallets/wallet.module';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, ...superAdminProviders],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
