import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { couponProvider } from './coupon.provider';
import { DatabaseModule } from 'src/database/database.module';
import { couponTemplateProvider } from './coupon-template.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { SystemLogModule } from '../system-logs/system-log.module';
import { adminProviders } from '../admins/admin.provider';
import { CouponExpiryCronService } from './coupon-expiry-cron.service';
import { MERCHANT_WALLET_REPOSITORY, CREDITS_LEDGER_REPOSITORY } from '../wallets/wallet.provider';
import { MerchantWallet } from '../wallets/entities/merchant-wallet.entity';
import { CreditsLedger } from '../wallets/entities/credits-ledger.entity';
import { DataSource } from 'typeorm';

@Module({
  imports: [DatabaseModule, SystemLogModule],
  controllers: [CouponController],
  providers: [
    CouponService,
    CouponExpiryCronService,
    ...couponProvider,
    ...couponTemplateProvider,
    ...merchantProviders,
    ...adminProviders,
    {
      provide: MERCHANT_WALLET_REPOSITORY,
      useFactory: (dataSource: DataSource) => dataSource.getRepository(MerchantWallet),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: CREDITS_LEDGER_REPOSITORY,
      useFactory: (dataSource: DataSource) => dataSource.getRepository(CreditsLedger),
      inject: ['DATA_SOURCE'],
    },
  ],
  exports: [CouponService],
})
export class CouponModule {}
