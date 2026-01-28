import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import * as Modules from './modules';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { envConfig } from './common/config/env.config';
import { ScheduleModule } from '@nestjs/schedule';
import { StripeModule } from './stripe/stripe.module';
import { AgentStripeSettingsModule } from './modules/agent-stripe-settings/agent-stripe-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    DatabaseModule,
    ...Object.values(Modules),
    NestjsFormDataModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    StripeModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule { }
