import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { LuckyDrawController } from './lucky-draw.controller';
import { LuckyDrawService } from './lucky-draw.service';
import { luckyDrawProviders } from './lucky-draw.provider';
import { WhatsAppService } from 'src/common/services/whatsapp.service';
import { customerProviders } from '../customers/customer.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { couponProvider } from '../coupons/coupon.provider';
import { couponBatchProvider } from '../coupon-batches/coupon-batch.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [LuckyDrawController],
  providers: [
    ...luckyDrawProviders,
    ...customerProviders,
    ...merchantProviders,
    ...couponProvider,
    ...couponBatchProvider,
    LuckyDrawService,
    WhatsAppService,
  ],
  exports: [LuckyDrawService],
})
export class LuckyDrawModule {}
