import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MerchantSettingService } from './merchant-setting.service';
import { CreateMerchantSettingDto } from './dto/create-merchant-setting.dto';
import { UpdateMerchantSettingDto } from './dto/update-merchant-setting.dto';
import { UploadPaidAdImageDto } from './dto/upload-paid-ad-image.dto';
import { UploadPaidAdVideoDto } from './dto/upload-paid-ad-video.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FormDataRequest } from 'nestjs-form-data';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('merchant-settings')
export class MerchantSettingController {
  constructor(private readonly merchantSettingService: MerchantSettingService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMerchantSettingDto: CreateMerchantSettingDto) {
    return this.merchantSettingService.create(createMerchantSettingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription-fee')
  getSubscriptionFee() {
    return this.merchantSettingService.getSubscriptionFee();
  }

  @Public()
  @Get('merchant/:merchantId')
  findByMerchantId(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.merchantSettingService.findByMerchantId(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('merchant/:merchantId')
  update(
    @Param('merchantId', ParseIntPipe) merchantId: number,
    @Body() updateMerchantSettingDto: UpdateMerchantSettingDto,
  ) {
    return this.merchantSettingService.update(merchantId, updateMerchantSettingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('merchant/:merchantId/paid-ad-image')
  @FormDataRequest()
  uploadPaidAdImage(
    @Param('merchantId', ParseIntPipe) merchantId: number,
    @Body() uploadPaidAdImageDto: UploadPaidAdImageDto,
  ) {
    return this.merchantSettingService.uploadPaidAdImage(
      merchantId,
      uploadPaidAdImageDto.paidAdImage,
      uploadPaidAdImageDto.paidAdPlacement,
      uploadPaidAdImageDto.paidAdDuration,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('merchant/:merchantId/paid-ad-video')
  @FormDataRequest()
  uploadPaidAdVideo(
    @Param('merchantId', ParseIntPipe) merchantId: number,
    @Body() uploadPaidAdVideoDto: UploadPaidAdVideoDto,
  ) {
    return this.merchantSettingService.uploadPaidAdVideo(
      merchantId,
      uploadPaidAdVideoDto.paidAdVideo,
      uploadPaidAdVideoDto.paidAdPlacement,
      uploadPaidAdVideoDto.paidAdDuration,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('merchant/:merchantId/paid-ad-image')
  deletePaidAdImage(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.merchantSettingService.deletePaidAdImage(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('merchant/:merchantId/paid-ad-video')
  deletePaidAdVideo(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.merchantSettingService.deletePaidAdVideo(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('merchant/:merchantId')
  remove(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.merchantSettingService.remove(merchantId);
  }
}
