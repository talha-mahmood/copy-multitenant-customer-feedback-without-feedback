import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { MonthlyStatementService } from './monthly-statement.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import { Public } from 'src/common/decorators/public.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('monthly-statements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonthlyStatementController {
  constructor(private readonly monthlyStatementService: MonthlyStatementService) {}

  @Post('generate')
  async generateStatements(
    @Body() body: { year: number; month: number; owner_type?: string; owner_id?: number },
    @Req() req?: any
  ) {
    // Only super_admin can trigger generation
    if (req.user.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can generate statements');
    }

    return this.monthlyStatementService.generateStatements(
      body.year,
      body.month,
      body.owner_type,
      body.owner_id
    );
  }

  @Get()
  @Roles('super_admin', 'admin', 'merchant', 'finance_viewer')
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
  @Roles('super_admin', 'admin', 'merchant', 'finance_viewer')
  async findOne(@Param('id') id: number, @Req() req: any) {
    const result = await this.monthlyStatementService.findOne(id);
    const statement = result.data;

    // Check permissions (finance_viewer can view all)
    if (req.user.role === 'merchant' && statement.owner_id !== req.user.merchantId) {
      throw new UnauthorizedException('You can only view your own statements');
    }

    if (req.user.role === 'admin' && statement.owner_id !== req.user.adminId && statement.owner_type === 'agent') {
      throw new UnauthorizedException('You can only view your own statements');
    }

    return result;
  }

  @Get(':id/download')
  @Roles('super_admin', 'admin', 'merchant', 'finance_viewer')
  async downloadPdf(@Param('id') id: number, @Req() req: any, @Res() res: Response) {
    const result = await this.monthlyStatementService.findOne(id);
    const statement = result.data;

    // Check permissions (finance_viewer can download all)
    if (req.user?.role === 'merchant' && statement.owner_id !== req.user.merchantId) {
      throw new UnauthorizedException('You can only download your own statements');
    }

    if (req.user?.role === 'admin' && statement.owner_id !== req.user.adminId && statement.owner_type === 'agent') {
      throw new UnauthorizedException('You can only download your own statements');
    }

    const pdfPath = await this.monthlyStatementService.downloadPdf(id);
    
    res.download(pdfPath, `statement_${statement.year}_${statement.month}.pdf`, (err) => {
      if (err) {
        throw new Error('Failed to download PDF');
      }
    });
  }
}
