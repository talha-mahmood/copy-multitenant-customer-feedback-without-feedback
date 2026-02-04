import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminSettingsService } from './super-admin-settings.service';
import { UpdateSuperAdminSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('super-admin-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuperAdminSettingsController {
  constructor(private readonly settingsService: SuperAdminSettingsService) { }

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return {
      message: 'Settings retrieved successfully',
      data: settings,
    };
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch()
  async updateSettings(@Body() updateDto: UpdateSuperAdminSettingsDto) {
    const settings = await this.settingsService.updateSettings(updateDto);
    return {
      message: 'Settings updated successfully',
      data: settings,
    };
  }

  @SkipSubscription()
  @Get('admin-subscription-fee')
  async getAdminSubscriptionFee() {
    const { fee, currency } = await this.settingsService.getAdminSubscriptionFee();
    return {
      message: 'Admin subscription fee retrieved successfully',
      data: { fee, currency },
    };
  }

  @SkipSubscription()
  @Get('commission-settings')
  async getCommissionSettings() {
    const settings = await this.settingsService.getCommissionSettings();
    return {
      message: 'Commission settings retrieved successfully',
      data: settings,
    };
  }


  @SkipSubscription()
  @Get('merchant-annual-fee')
  async getMerchantAnnualFee() {
    const settings = await this.settingsService.getSettings();
    return {
      message: 'Merchant annual fee retrieved successfully',
      data: {
        fee: parseFloat(settings.merchant_annual_fee.toString()),
        currency: settings.currency,
      },
    };
  }
}
