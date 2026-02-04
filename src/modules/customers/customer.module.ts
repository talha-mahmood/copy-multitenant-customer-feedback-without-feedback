import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DatabaseModule } from 'src/database/database.module';
import { customerProviders } from './customer.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { merchantSettingProviders } from '../merchant-settings/merchant-setting.provider';
import { couponProvider } from '../coupons/coupon.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [DatabaseModule, WhatsAppModule, WalletModule, SystemLogModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    ...customerProviders,
    ...merchantProviders,
    ...merchantSettingProviders,
    ...couponProvider,
    ...couponBatchProvider,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
