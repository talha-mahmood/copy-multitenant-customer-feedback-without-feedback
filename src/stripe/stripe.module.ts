import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { AdminModule } from '../modules/admins/admin.module';
import { MerchantModule } from '../modules/merchants/merchant.module';
import { StripeContextService } from './stripe-context.service';

@Module({
  imports: [AdminModule, MerchantModule],
  providers: [StripeService, StripeContextService],
  controllers: [StripeController],
  exports: [StripeService, StripeContextService],
})
export class StripeModule {}
