import { Module } from '@nestjs/common';
import { MerchantSettingService } from './merchant-setting.service';
import { MerchantSettingController } from './merchant-setting.controller';
import { DatabaseModule } from 'src/database/database.module';
import { merchantSettingProviders } from './merchant-setting.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [MerchantSettingController],
  providers: [MerchantSettingService, ...merchantSettingProviders],
  exports: [MerchantSettingService],
})
export class MerchantSettingModule {}
