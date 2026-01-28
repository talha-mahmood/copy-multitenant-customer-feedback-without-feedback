import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentStripeSettingsService } from './agent-stripe-settings.service';
import { AgentStripeSettingsController } from './agent-stripe-settings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { agentStripeSettingsProviders } from './agent-stripe-settings.provider';
import { adminProviders } from 'src/modules/admins/admin.provider';
import { EncryptionHelper } from 'src/common/helpers/encryption-helper';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AgentStripeSettingsController],
  providers: [
    AgentStripeSettingsService,
    EncryptionHelper,
    ...agentStripeSettingsProviders,
    ...adminProviders,
  ],
  exports: [AgentStripeSettingsService, ...agentStripeSettingsProviders],
})
export class AgentStripeSettingsModule { }
