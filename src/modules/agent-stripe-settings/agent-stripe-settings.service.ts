import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { EncryptionHelper } from 'src/common/helpers/encryption-helper';
import { UpdateStripeSettingsDto } from './dto/update-stripe-settings.dto';
import { AgentStripeSetting } from './entities/agent-stripe-setting.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

@Injectable()
export class AgentStripeSettingsService {
  constructor(
    @Inject('AGENT_STRIPE_SETTING_REPOSITORY')
    private readonly stripeSettingRepository: Repository<AgentStripeSetting>,
    @Inject('ADMIN_REPOSITORY')
    private readonly adminRepository: Repository<Admin>,
    private readonly encryptionHelper: EncryptionHelper,
  ) { }

  async updateStripeSettings(adminId: number, dto: UpdateStripeSettingsDto) {
    // 1. Validate Admin exists
    const admin = await this.adminRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Agent not found');
    }


    // 2. Validate Stripe Secret Key by calling stripe.accounts.retrieve()
    // Skip validation if STRIPE_MOCK_MODE is enabled (for testing)
    const mockMode = process.env.STRIPE_MOCK_MODE === 'true';

    if (!mockMode) {
      try {
        const stripe = new Stripe(dto.stripeSecretKey, {
          apiVersion: '2025-12-15.clover',
        });
        await stripe.accounts.retrieve();
      } catch (error) {
        throw new BadRequestException(`Invalid Stripe Secret Key: ${error.message}`);
      }
    } else {
      console.warn('⚠️  STRIPE_MOCK_MODE is enabled - Skipping Stripe API validation');
    }

    // 3. Encrypt sensitive fields
    const encryptedSecretKey = this.encryptionHelper.encrypt(dto.stripeSecretKey);
    const encryptedWebhookSecret = dto.stripeWebhookSecret
      ? this.encryptionHelper.encrypt(dto.stripeWebhookSecret)
      : null;

    // 4. Save or Update settings
    let setting = await this.stripeSettingRepository.findOne({ where: { admin_id: adminId } });

    if (!setting) {
      setting = new AgentStripeSetting();
      setting.admin_id = adminId;
    }

    setting.publishable_key = dto.stripePublishableKey;
    setting.secret_key = encryptedSecretKey;
    setting.webhook_secret = encryptedWebhookSecret;

    await this.stripeSettingRepository.save(setting);

    return {
      message: 'Stripe settings updated successfully',
      publishableKey: dto.stripePublishableKey
    };
  }

  async getStripeSettings(adminId: number) {
    const setting = await this.stripeSettingRepository.findOne({ where: { admin_id: adminId } });
    if (!setting) {
      return null;
    }

    // Never return secret keys to the frontend
    return {
      publishableKey: setting.publishable_key,
      hasSecretKey: !!setting.secret_key,
      hasWebhookSecret: !!setting.webhook_secret,
    };
  }

  async getDecryptedSecretKey(adminId: number): Promise<string> {
    const setting = await this.stripeSettingRepository.findOne({ where: { admin_id: adminId } });
    if (!setting || !setting.secret_key) {
      throw new BadRequestException('Agent has not configured Stripe settings');
    }
    return this.encryptionHelper.decrypt(setting.secret_key);
  }
}
