import { Module } from '@nestjs/common';
import { MerchantSettingService } from './merchant-setting.service';
import { MerchantSettingController } from './merchant-setting.controller';
import { DatabaseModule } from 'src/database/database.module';
import { merchantSettingProviders } from './merchant-setting.provider';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { Merchant } from '../merchants/entities/merchant.entity';
import { DataSource } from 'typeorm';
import { merchantProviders } from '../merchants/merchant.provider';

@Module({
  imports: [DatabaseModule, NestjsFormDataModule],
  controllers: [MerchantSettingController],
  providers: [
    MerchantSettingService,
    ...merchantSettingProviders,
    ...merchantProviders
   
  ],
  exports: [MerchantSettingService],
})
export class MerchantSettingModule { }
