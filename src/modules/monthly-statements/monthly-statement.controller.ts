import { Controller, Get, Post, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { MonthlyStatementService } from './monthly-statement.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('monthly-statements')
@UseGuards(JwtAuthGuard)
export class MonthlyStatementController {
  constructor(private readonly monthlyStatementService: MonthlyStatementService) {}

  @Post('generate')
  async generateAllStatements(@Query('year') year?: number, @Query('month') month?: number, @Req() req?: any) {
    // Only super_admin can trigger generation
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }

    return this.monthlyStatementService.generateAllMonthlyStatements(year, month);
  }

  @Get()
  async findAll(
    @Query('owner_type') ownerType: string,
    @Query('owner_id') ownerId: number,
    @Query('year') year: number,
    @Query('month') month: number,
    @Req() req: any,
  ) {
    // Merchants can only view their own statements
    if (req.user.role === 'merchant') {
      ownerType = 'merchant';
      ownerId = req.user.merchantId;
    }

    // Agents can only view their own statements
    if (req.user.role === 'admin' && !ownerType) {
      ownerType = 'agent';
      ownerId = req.user.adminId;
    }

    return this.monthlyStatementService.findAll(ownerType, ownerId, year, month);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: any) {
    const result = await this.monthlyStatementService.findOne(id);
    const statement = result.data;

    // Check permissions
    if (req.user.role === 'merchant' && statement.owner_id !== req.user.merchantId) {
      throw new Error('Unauthorized');
    }

    if (req.user.role === 'admin' && statement.owner_id !== req.user.adminId && statement.owner_type === 'agent') {
      throw new Error('Unauthorized');
    }

    return result;
  }

  @Get(':id/download')
  async downloadPdf(@Param('id') id: number, @Req() req: any, @Res() res: Response) {
    const result = await this.monthlyStatementService.findOne(id);
    const statement = result.data;

    // Check permissions
    if (req.user.role === 'merchant' && statement.owner_id !== req.user.merchantId) {
      throw new Error('Unauthorized');
    }

    if (req.user.role === 'admin' && statement.owner_id !== req.user.adminId && statement.owner_type === 'agent') {
      throw new Error('Unauthorized');
    }

    const pdfPath = await this.monthlyStatementService.downloadPdf(id);
    
    res.download(pdfPath, `statement_${statement.year}_${statement.month}.pdf`, (err) => {
      if (err) {
        throw new Error('Failed to download PDF');
      }
    });
  }
}
