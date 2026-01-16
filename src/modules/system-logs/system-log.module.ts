import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { SystemLogController } from './system-log.controller';
import { SystemLogService } from './system-log.service';
import { systemLogProviders } from './system-log.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [SystemLogController],
  providers: [...systemLogProviders, SystemLogService],
  exports: [SystemLogService],
})
export class SystemLogModule {}
