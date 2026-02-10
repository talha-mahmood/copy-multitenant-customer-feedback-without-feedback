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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ShowAdminDto } from './dto/show-admin.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admins')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @Roles('super_admin', 'finance_viewer')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.adminService.findAll(page, pageSize, search, isActive);
  }

  @Get(':id/dashboard')
  getDashboard(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AdminDashboardQueryDto,
  ) {
    return this.adminService.getDashboardAnalytics(id, query.startDate, query.endDate);
  }
  @Public()
  @Get(':merchantId/paid-ad-image')
  getPaidAdImage(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.adminService.getPaidAdImage(merchantId);
  }
  @Get(':id/approvals')
  getApprovals(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getApprovalsByAgentId(id);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'finance_viewer')
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
