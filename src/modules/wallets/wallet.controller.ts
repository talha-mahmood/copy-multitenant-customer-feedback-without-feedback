import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AddCreditsDto } from './dto/add-credits.dto';
import { UpgradeToAnnualDto } from './dto/upgrade-to-annual.dto';
import { CreateCreditPackageDto } from './dto/create-credit-package.dto';
import { UpdateCreditPackageDto } from './dto/update-credit-package.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('admin/:adminId')
  async getAdminWallet(@Param('adminId') adminId: number) {
    return await this.walletService.getAdminWallet(adminId);
  }

  @Get('merchant/:merchantId')
  async getMerchantWallet(@Param('merchantId') merchantId: number) {
    return await this.walletService.getMerchantWallet(merchantId);
  }

  @Roles(UserRole.SUPER_ADMIN, 'finance_viewer')
  @Get('super-admin')
  async getSuperAdminWallet() {
    return await this.walletService.getSuperAdminWallet();
  }

  @SkipSubscription()
  @Post('admin/:adminId/subscribe')
  async processAdminSubscription(@Param('adminId') adminId: number) {
    return await this.walletService.processAdminSubscriptionPayment(adminId);
  }

  @SkipSubscription()
  @Post('admin/:adminId/topup')
  async topUpAdminWallet(
    @Param('adminId') adminId: number,
    @Body() topUpDto: TopUpWalletDto,
  ) {
    const transaction = await this.walletService.creditAdminWallet(
      adminId,
      topUpDto.amount,
      topUpDto.description || 'Wallet top-up via Stripe',
      topUpDto.metadata,
    );

    return {
      message: 'Wallet topped up successfully',
      data: transaction,
    };
  }

  @Get('admin/:adminId/transactions')
  async getAdminTransactions(
    @Param('adminId') adminId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.walletService.getAdminTransactions(
      adminId,
      Number(page),
      Number(limit),
    );
  }

  @Get('merchant/:merchantId/transactions')
  async getMerchantTransactions(
    @Param('merchantId') merchantId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.walletService.getMerchantTransactions(
      merchantId,
      Number(page),
      Number(limit),
    );
  }

  @SkipSubscription()
  @Post('merchant/:merchantId/add-credits')
  async addMerchantCredits(
    @Param('merchantId') merchantId: number,
    @Body() addCreditsDto: AddCreditsDto,
  ) {
    const result = await this.walletService.addMerchantCredits(
      merchantId,
      addCreditsDto.package_id,
      addCreditsDto.credits,
      addCreditsDto.credit_type,
      addCreditsDto.amount,
      addCreditsDto.admin_id,
      addCreditsDto.description || 'Credits purchase',
      addCreditsDto.metadata,
    );

    return {
      message: 'Credits added successfully',
      data: result,
    };
  }

  @SkipSubscription()
  @Post('merchant/:merchantId/upgrade-to-annual')
  async upgradeToAnnual(
    @Param('merchantId') merchantId: number,
    @Body() upgradeDto: UpgradeToAnnualDto,
  ) {
    const result = await this.walletService.upgradeToAnnual(
      merchantId,
      upgradeDto.admin_id,
    );

    return {
      message: 'Merchant upgraded to annual subscription',
      data: result,
    };
  }

  @SkipSubscription()
  @Get('credit-packages/:id')
  async getCreditPackage(@Param('id') id: number) {
    return await this.walletService.getCreditPackage(id);
  }

  @SkipSubscription()
  @Get('credit-packages')
  async getCreditPackages(
    @Query('merchant_type') merchantType?: string,
  ) {
    return await this.walletService.getCreditPackages(merchantType);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('credit-packages')
  async createCreditPackage(@Body() createDto: CreateCreditPackageDto) {
    return await this.walletService.createCreditPackage(createDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('credit-packages/:id')
  async updateCreditPackage(
    @Param('id') id: number,
    @Body() updateDto: UpdateCreditPackageDto,
  ) {
    return await this.walletService.updateCreditPackage(id, updateDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('credit-packages/:id')
  async deleteCreditPackage(
    @Param('id') id: number,
  ) {
    return await this.walletService.deleteCreditPackage(id);
  }
}
