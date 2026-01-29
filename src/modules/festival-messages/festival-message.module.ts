import { Module } from '@nestjs/common';
import { FestivalMessageService } from './festival-message.service';
import { FestivalMessageController } from './festival-message.controller';
import { DatabaseModule } from 'src/database/database.module';
import { festivalMessageProviders } from './festival-message.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [FestivalMessageController],
  providers: [FestivalMessageService, ...festivalMessageProviders],
  exports: [FestivalMessageService],
})
export class FestivalMessageModule {}
