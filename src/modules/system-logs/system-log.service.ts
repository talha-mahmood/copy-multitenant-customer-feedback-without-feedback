import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/system-log.entity';
import { SystemLogCategory, SystemLogAction, SystemLogLevel } from 'src/common/enums/system-log.enum';

export interface CreateSystemLogDto {
  category: SystemLogCategory;
  action: SystemLogAction;
  message: string;
  level?: SystemLogLevel;
  userId?: number;
  userType?: string;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SystemLogService {
  constructor(
    @Inject('SYSTEM_LOG_REPOSITORY')
    private systemLogRepository: Repository<SystemLog>,
  ) {}

  async log(data: CreateSystemLogDto): Promise<SystemLog> {
    const log = this.systemLogRepository.create({
      category: data.category,
      action: data.action,
      message: data.message,
      level: data.level || SystemLogLevel.INFO,
      user_id: data.userId,
      user_type: data.userType,
      entity_type: data.entityType,
      entity_id: data.entityId,
      metadata: data.metadata,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });

    return await this.systemLogRepository.save(log);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      category?: SystemLogCategory;
      action?: SystemLogAction;
      level?: SystemLogLevel;
      userId?: number;
      userType?: string;
      entityType?: string;
      entityId?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const queryBuilder = this.systemLogRepository.createQueryBuilder('log');

    if (filters?.category) {
      queryBuilder.andWhere('log.category = :category', { category: filters.category });
    }

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters?.level) {
      queryBuilder.andWhere('log.level = :level', { level: filters.level });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('log.user_id = :userId', { userId: filters.userId });
    }

    if (filters?.userType) {
      queryBuilder.andWhere('log.user_type = :userType', { userType: filters.userType });
    }

    if (filters?.entityType) {
      queryBuilder.andWhere('log.entity_type = :entityType', { entityType: filters.entityType });
    }

    if (filters?.entityId) {
      queryBuilder.andWhere('log.entity_id = :entityId', { entityId: filters.entityId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('log.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('log.created_at <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'System logs retrieved successfully',
      data: logs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const log = await this.systemLogRepository.findOne({ where: { id } });
    
    if (!log) {
      return {
        message: 'Log not found',
        data: null,
      };
    }

    return {
      message: 'System log retrieved successfully',
      data: log,
    };
  }

  // Helper methods for common log types
  async logAuth(action: SystemLogAction, userId: number, userType: string, message: string, metadata?: Record<string, any>, ipAddress?: string) {
    return this.log({
      category: SystemLogCategory.AUTH,
      action,
      message,
      userId,
      userType,
      metadata,
      ipAddress,
    });
  }

  async logMerchant(action: SystemLogAction, merchantId: number, message: string, userId?: number, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.MERCHANT,
      action,
      message,
      userId,
      userType: 'admin',
      entityType: 'merchant',
      entityId: merchantId,
      metadata,
    });
  }

  async logCoupon(action: SystemLogAction, couponId: number, message: string, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.COUPON,
      action,
      message,
      entityType: 'coupon',
      entityId: couponId,
      metadata,
    });
  }

  async logWhatsApp(action: SystemLogAction, message: string, customerId?: number, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.WHATSAPP,
      action,
      message,
      entityType: 'customer',
      entityId: customerId,
      metadata,
      level: action === SystemLogAction.MESSAGE_FAILED ? SystemLogLevel.WARNING : SystemLogLevel.INFO,
    });
  }

  async logWallet(action: SystemLogAction, message: string, userId: number, userType: string, amount: number, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.WALLET,
      action,
      message,
      userId,
      userType,
      metadata: { ...metadata, amount },
    });
  }

  async logCampaign(action: SystemLogAction, message: string, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.CAMPAIGN,
      action,
      message,
      level: SystemLogLevel.INFO,
      metadata,
    });
  }

  async logSystem(action: SystemLogAction, message: string, level: SystemLogLevel = SystemLogLevel.INFO, metadata?: Record<string, any>) {
    return this.log({
      category: SystemLogCategory.SYSTEM,
      action,
      message,
      level,
      metadata,
    });
  }
}
