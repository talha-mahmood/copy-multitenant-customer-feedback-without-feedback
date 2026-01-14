import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CouponBatchService } from './coupon-batch.service';
import { CreateCouponBatchDto } from './dto/create-coupon-batch.dto';
import { UpdateCouponBatchDto } from './dto/update-coupon-batch.dto';
import { ShowCouponBatchDto } from './dto/show-coupon-batch.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { CurrentUser, User } from 'src/common/decorators/current-user';

@Controller('coupon-batches')
@UseGuards(JwtAuthGuard)
export class CouponBatchController {
  constructor(private readonly couponBatchService: CouponBatchService) {}

  @Post()
  create(@Body() createCouponBatchDto: CreateCouponBatchDto) {
    return this.couponBatchService.create(createCouponBatchDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('merchantId') merchantId?: number,
  ) {
    const effectiveMerchantId = user.role === 'merchant' && typeof user.merchantId === 'number' ? user.merchantId : merchantId;
    return this.couponBatchService.findAll(page, pageSize, {
      merchantId: effectiveMerchantId
    }, user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param() showCouponBatchDto: ShowCouponBatchDto) {
    return this.couponBatchService.findOne(showCouponBatchDto.id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCouponBatchDto: UpdateCouponBatchDto) {
    return this.couponBatchService.update(id, updateCouponBatchDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponBatchService.remove(id);
  }

  /**
   * Export all coupon batches and coupons for the current merchant as PDF (base64)
   */

  @Get('export/pdf/:batchId')
  async exportBatchPdf(@Param('batchId') batchId: number) {
    return this.couponBatchService.exportBatchPdf(batchId);
  }
}
