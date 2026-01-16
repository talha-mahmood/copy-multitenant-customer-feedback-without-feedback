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

    // Build filters from query parameters
    const filters: any = {};
    
    if (category) filters.category = category;
    if (action) filters.action = action;
    if (level) filters.level = level;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (userId !== undefined) filters.userId = userId;
    if (userType) filters.userType = userType;

    // Access control: Admins can only see their own logs, Super admins see all
    if (user.role === 'admin' && user.adminId) {
      // Filter logs where either:
      // 1. user_id matches admin's user ID and user_type is 'admin' (for auth logs)
      // 2. metadata->adminId matches the admin's adminId (for merchant/coupon/etc logs)
      filters.adminId = user.adminId; // Use the admin's adminId from the admins table
    }
    // Super admin (user.role === 'super_admin') - no restrictions, sees all logs

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
