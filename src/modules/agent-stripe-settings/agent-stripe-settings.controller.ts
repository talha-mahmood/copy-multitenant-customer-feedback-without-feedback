import { Body, Controller, Get, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentStripeSettingsService } from './agent-stripe-settings.service';
import { UpdateStripeSettingsDto } from './dto/update-stripe-settings.dto';
import { CurrentUser, User } from 'src/common/decorators/current-user';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('Agent Stripe Settings')
@ApiBearerAuth()
@Controller('agent/stripe-settings')
export class AgentStripeSettingsController {
  constructor(private readonly stripeSettingsService: AgentStripeSettingsService) { }

  @Post()
  @ApiOperation({ summary: 'Save or update agent Stripe keys' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateStripeSettingsDto,
  ) {
    if (!user.adminId) {
      throw new ForbiddenException('Only agents can update Stripe settings');
    }
    return this.stripeSettingsService.updateStripeSettings(user.adminId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get agent Stripe settings (public parts only)' })
  async getSettings(@CurrentUser() user: User) {
    if (!user.adminId) {
      throw new ForbiddenException('Access denied');
    }
    return this.stripeSettingsService.getStripeSettings(user.adminId);
  }
}
