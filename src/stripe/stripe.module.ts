import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { AgentStripeSettingsModule } from 'src/modules/agent-stripe-settings/agent-stripe-settings.module';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Module({
  imports: [
    DatabaseModule,
    AgentStripeSettingsModule,
  ],
  providers: [
    StripeService,
    {
      provide: 'MERCHANT_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Merchant),
      inject: ['DATA_SOURCE'],
    },
  ],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule { }
