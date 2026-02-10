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
import { CurrentUser, User } from 'src/common/decorators/current-user';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { ShowMerchantDto } from './dto/show-merchant.dto';
import { MerchantDashboardQueryDto } from './dto/merchant-dashboard.dto';
import { bool } from 'aws-sdk/clients/signer';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('merchants')
@UseGuards(RolesGuard)
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post()
  create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'merchant', 'finance_viewer')
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.merchantService.findAll(page, pageSize, search, isActive, user);
  }

  @Get(':id/dashboard')
  getDashboard(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MerchantDashboardQueryDto,
  ) {
    return this.merchantService.getDashboardAnalytics(id, query.startDate, query.endDate);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'merchant', 'finance_viewer')
  findOne(
    @CurrentUser() user: User,
    @Param() showMerchantDto: ShowMerchantDto,
  ) {
    return this.merchantService.findOne(showMerchantDto.id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMerchantDto: UpdateMerchantDto) {
    return this.merchantService.update(id, updateMerchantDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.remove(id);
  }

  @Get(':id/qr-code')
  getQRCode(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.getQRCode(id);
  }

  @Post(':id/generate-qr-code')
  generateQRCode(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.generateQRCode(id);
  }
}
