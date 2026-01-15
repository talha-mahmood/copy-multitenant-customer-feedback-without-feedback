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
import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CouponTemplate } from './entities/coupon-template.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ShowCouponDto } from './dto/show-coupon.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser, User } from 'src/common/decorators/current-user';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    @Inject('COUPON_TEMPLATE_REPOSITORY')
    private readonly couponTemplateRepo: Repository<CouponTemplate>,
  ) { }

  /**
   * Get public coupon feed, optionally filtered by merchant business type and placement.
   * This endpoint is public and does not require authentication.
   */
  @Public()
  @Get('public-feed')
  getPublicCoupons(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('businessType') businessType?: string,
    @Query('placement') placement?: string,
    @Query('adminId') adminId?: number,
  ) {
    return this.couponService.findAllPublic(page, pageSize, businessType, placement, adminId);
  }

  /**
   * Get super admin feed - shows all agents with their merchants and coupons.
   * This endpoint is public and returns a hierarchical structure.
   */
  @Public()
  @Get('super-admin-feed')
  getSuperAdminFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.couponService.findAllForSuperAdmin(page, pageSize);
  }
  /**
   * List coupon templates for annual merchants
   */
  @Get('templates/annual')
  async getAnnualTemplates() {
    const templates = await this.couponTemplateRepo.find({ where: { type: 'annual' } });
    return { message: 'Annual templat es', data: templates };
  }

  /**
   * List coupon template for temporary merchants
   */
  @Get('templates/temporary')
  async getTemporaryTemplate() {
    const templates = await this.couponTemplateRepo.find({ where: { type: 'temporary' } });
    return { message: 'Temporary template', data: templates };
  }

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('merchantId') merchantId?: number,
    @Query('customerId') customerId?: number,
    @Query('batchId') batchId?: number,
    @Query('status') status?: string,
  ) {
    const effectiveMerchantId = user.role === 'merchant' && typeof user.merchantId === 'number' ? user.merchantId : merchantId;
    return this.couponService.findAll(page, pageSize, {
      merchantId: effectiveMerchantId,
      customerId,
      batchId,
      status,
    }, user);
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param() showCouponDto: ShowCouponDto) {
    return this.couponService.findOne(showCouponDto.id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  /**
   * Update coupon status (created -> issued -> redeemed)
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto
  ) {
    if (!updateCouponDto.status) {
      throw new Error('Status is required');
    }
    return this.couponService.updateCouponStatus(id, updateCouponDto.status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.remove(id);
  }

  /**
   * Redeem a coupon by its unique coupon_code
   */
  @Post('redeem')
  async redeem(@Body('couponCode') couponCode: string) {
    return this.couponService.redeemCoupon(couponCode);
  }
}
