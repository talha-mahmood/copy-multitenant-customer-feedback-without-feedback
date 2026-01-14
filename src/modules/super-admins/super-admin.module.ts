import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { DatabaseModule } from 'src/database/database.module';
import { superAdminProviders } from './super-admin.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, ...superAdminProviders],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
