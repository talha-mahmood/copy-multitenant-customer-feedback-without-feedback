import { Module } from '@nestjs/common';
import { CouponBatchService } from './coupon-batch.service';
import { CouponBatchController } from './coupon-batch.controller';
import { couponBatchProvider } from './coupon-batch.provider';
import { DatabaseModule } from 'src/database/database.module';
import { merchantProviders } from '../merchants/merchant.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [CouponBatchController],
  providers: [CouponBatchService, ...couponBatchProvider, ...merchantProviders],
  exports: [CouponBatchService],
})
export class CouponBatchModule {}
