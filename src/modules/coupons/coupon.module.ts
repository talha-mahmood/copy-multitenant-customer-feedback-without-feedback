import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { couponProvider } from './coupon.provider';
import { DatabaseModule } from 'src/database/database.module';
import { couponTemplateProvider } from './coupon-template.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { SystemLogModule } from '../system-logs/system-log.module';
import { adminProviders } from '../admins/admin.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, SystemLogModule, ConfigModule],
  controllers: [CouponController],
  providers: [CouponService, ...couponProvider, ...couponTemplateProvider, ...merchantProviders, ...adminProviders],
  exports: [CouponService],
})
export class CouponModule { }
