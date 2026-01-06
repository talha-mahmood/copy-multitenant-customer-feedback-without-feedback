import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { LuckyDrawController } from './lucky-draw.controller';
import { LuckyDrawService } from './lucky-draw.service';
import { luckyDrawProviders } from './lucky-draw.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [LuckyDrawController],
  providers: [...luckyDrawProviders, LuckyDrawService],
  exports: [LuckyDrawService],
})
export class LuckyDrawModule {}
