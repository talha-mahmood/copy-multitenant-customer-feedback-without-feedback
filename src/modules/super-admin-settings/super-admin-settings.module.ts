import { Module } from '@nestjs/common';
import { SuperAdminSettingsService } from './super-admin-settings.service';
import { SuperAdminSettingsController } from './super-admin-settings.controller';
import { superAdminSettingsProviders } from './super-admin-settings.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SuperAdminSettingsController],
  providers: [SuperAdminSettingsService, ...superAdminSettingsProviders],
  exports: [SuperAdminSettingsService],
})
export class SuperAdminSettingsModule {}
