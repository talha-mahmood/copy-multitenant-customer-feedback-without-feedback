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
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ShowCouponDto } from './dto/show-coupon.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('merchantId') merchantId?: number,
    @Query('customerId') customerId?: number,
    @Query('batchId') batchId?: number,
    @Query('status') status?: string,
  ) {
    return this.couponService.findAll(page, pageSize, {
      merchantId,
      customerId,
      batchId,
      status,
    });
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Get(':id')
  findOne(@Param() showCouponDto: ShowCouponDto) {
    return this.couponService.findOne(showCouponDto.id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.remove(id);
  }
}
