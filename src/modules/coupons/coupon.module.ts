import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { couponProvider } from './coupon.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CouponController],
  providers: [CouponService, ...couponProvider],
  exports: [CouponService],
})
export class CouponModule {}
