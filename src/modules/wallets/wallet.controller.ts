import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AddCreditsDto } from './dto/add-credits.dto';
import { UpgradeToAnnualDto } from './dto/upgrade-to-annual.dto';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('admin/:adminId')
  async getAdminWallet(@Param('adminId') adminId: number) {
    return await this.walletService.getAdminWallet(adminId);
  }

  @Get('merchant/:merchantId')
  async getMerchantWallet(@Param('merchantId') merchantId: number) {
    return await this.walletService.getMerchantWallet(merchantId);
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

  @Post('merchant/:merchantId/add-credits')
  async addMerchantCredits(
    @Param('merchantId') merchantId: number,
    @Body() addCreditsDto: AddCreditsDto,
  ) {
    const result = await this.walletService.addMerchantCredits(
      merchantId,
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

  @Get('credit-packages')
  async getCreditPackages(@Query('merchant_type') merchantType?: string) {
    return await this.walletService.getCreditPackages(merchantType);
  }
}
