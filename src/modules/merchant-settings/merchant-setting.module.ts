import { Module } from '@nestjs/common';
import { MerchantSettingService } from './merchant-setting.service';
import { MerchantSettingController } from './merchant-setting.controller';
import { DatabaseModule } from 'src/database/database.module';
import { merchantSettingProviders } from './merchant-setting.provider';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { Merchant } from '../merchants/entities/merchant.entity';
import { DataSource } from 'typeorm';
import { merchantProviders } from '../merchants/merchant.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';
import { WalletModule } from '../wallets/wallet.module';
import { superAdminSettingsProviders } from '../super-admin-settings/super-admin-settings.provider';
import { ApprovalModule } from '../approvals/approval.module';

@Module({
  imports: [DatabaseModule, NestjsFormDataModule, WalletModule, ApprovalModule],
  controllers: [MerchantSettingController],
  providers: [
    MerchantSettingService,
    ...merchantSettingProviders,
    ...superAdminSettingsProviders,
    ...merchantProviders,
    ...couponBatchProvider,
  ],
  exports: [MerchantSettingService],
})
export class MerchantSettingModule { }
