import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogCategory, SystemLogAction, SystemLogLevel } from 'src/common/enums/system-log.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser, User } from 'src/common/decorators/current-user';

@Controller('system-logs')
@UseGuards(JwtAuthGuard)
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('category') category?: SystemLogCategory,
    @Query('action') action?: SystemLogAction,
    @Query('level') level?: SystemLogLevel,
    @Query('userId') userId?: number,
    @Query('userType') userType?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }

    // Only super_admin can view all logs
    // Admin can only view logs related to their operations
    const filters: any = {
      category,
      action,
      level,
      userId,
      userType,
      entityType,
      entityId,
      startDate,
      endDate,
    };

    // If admin, restrict to their own logs
    if (user.role === 'admin' && user.adminId) {
      filters.userId = user.adminId;
      filters.userType = 'admin';
    }

    return this.systemLogService.findAll(page, pageSize, filters);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.systemLogService.findOne(id);
  }
}
