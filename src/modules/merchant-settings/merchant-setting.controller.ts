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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('merchant-settings')
export class MerchantSettingController {
  constructor(private readonly merchantSettingService: MerchantSettingService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMerchantSettingDto: CreateMerchantSettingDto) {
    return this.merchantSettingService.create(createMerchantSettingDto);
  }

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
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('merchant/:merchantId')
  remove(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.merchantSettingService.remove(merchantId);
  }
}
