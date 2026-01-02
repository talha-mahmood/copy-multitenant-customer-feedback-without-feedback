import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { couponProvider } from './coupon.provider';
import { DatabaseModule } from 'src/database/database.module';
import { couponTemplateProvider } from './coupon-template.provider';
import { merchantProviders } from '../merchants/merchant.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [CouponController],
  providers: [CouponService, ...couponProvider, ...couponTemplateProvider, ...merchantProviders],
  exports: [CouponService],
})
export class CouponModule {}
