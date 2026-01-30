import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { CreditLedgerService } from './credit-ledger.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('credit-ledgers')
@UseGuards(JwtAuthGuard)
export class CreditLedgerController {
  constructor(private readonly creditLedgerService: CreditLedgerService) {}

  @Get()
  async findAll(
    @Query('owner_type') ownerType: string,
    @Query('owner_id') ownerId: number,
    @Query('credit_type') creditType: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 50,
    @Req() req: any,
  ) {
    // If merchant, only allow viewing their own ledger
    if (req.user.role === 'merchant') {
      ownerId = req.user.merchantId;
      ownerType = 'merchant';
    }

    // If agent/admin, only allow viewing their own ledger unless superadmin
    if (req.user.role === 'admin' && req.user.adminId) {
      if (ownerType === 'agent' && !ownerId) {
        ownerId = req.user.adminId;
        ownerType = 'agent';
      }
    }

    return this.creditLedgerService.findAll(ownerType, ownerId, creditType, page, pageSize);
  }

  @Get('balances')
  async getBalances(@Query('owner_type') ownerType: string, @Query('owner_id') ownerId: number, @Req() req: any) {
    // If merchant, only allow viewing their own balance
    if (req.user.role === 'merchant') {
      ownerId = req.user.merchantId;
      ownerType = 'merchant';
    }

    // If agent/admin, only allow viewing their own balance unless superadmin
    if (req.user.role === 'admin' && req.user.adminId) {
      if (ownerType === 'agent' && !ownerId) {
        ownerId = req.user.adminId;
        ownerType = 'agent';
      }
    }

    return this.creditLedgerService.getBalances(ownerType, ownerId);
  }
}
