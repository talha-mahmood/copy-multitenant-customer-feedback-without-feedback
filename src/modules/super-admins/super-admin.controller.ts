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
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import { SuperAdminDashboardQueryDto } from './dto/super-admin-dashboard.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('super-admins')
@UseGuards(RolesGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }


  @Get('dashboard')
  getDashboard(
    @Query() query: SuperAdminDashboardQueryDto,
  ) {
    return this.superAdminService.getDashboardAnalytics(query.startDate, query.endDate);
  }

  @Post()
  create(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.superAdminService.create(createSuperAdminDto);
  }

  @Get()
  @Roles('super_admin', 'finance_viewer')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('isActive') isActive?: boolean,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.superAdminService.findAll(page, pageSize, search, isActive);
  }



  @Get(':id')
  @Roles('super_admin', 'finance_viewer')
  findOne(@Param('id') id: number) {
    return this.superAdminService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateSuperAdminDto: UpdateSuperAdminDto,
  ) {
    return this.superAdminService.update(id, updateSuperAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.superAdminService.remove(id);
  }

}