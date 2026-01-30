import { Module } from '@nestjs/common';
import { CouponBatchService } from './coupon-batch.service';
import { CouponBatchController } from './coupon-batch.controller';
import { couponBatchProvider } from './coupon-batch.provider';
import { DatabaseModule } from 'src/database/database.module';
import { merchantProviders } from '../merchants/merchant.provider';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from '../wallets/wallet.module';
import { SystemLogModule } from '../system-logs/system-log.module';
import { CouponExpiryCronService } from './coupon-expiry-cron.service';
import { CreditLedgerModule } from '../credits-ledger/credit-ledger.module';
import { couponProvider } from '../coupons/coupon.provider';
import { walletProviders } from '../wallets/wallet.provider';

@Module({
  imports: [DatabaseModule, ConfigModule, WalletModule, SystemLogModule, CreditLedgerModule],
  controllers: [CouponBatchController],
  providers: [
    CouponBatchService,
    CouponExpiryCronService,
    ...couponBatchProvider,
    ...merchantProviders,
    ...couponProvider,
    ...walletProviders,
  ],
  exports: [CouponBatchService],
})
export class CouponBatchModule {}
