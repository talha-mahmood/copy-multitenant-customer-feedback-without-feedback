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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ShowAdminDto } from './dto/show-admin.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard.dto';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.adminService.findAll(page, pageSize, search);
  }

  @Get(':id/dashboard')
  getDashboard(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AdminDashboardQueryDto,
  ) {
    return this.adminService.getDashboardAnalytics(id, query.startDate, query.endDate);
  }

  @Get(':id')
  findOne(@Param() showAdminDto: ShowAdminDto) {
    return this.adminService.findOne(showAdminDto.id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.remove(id);
  }
}
