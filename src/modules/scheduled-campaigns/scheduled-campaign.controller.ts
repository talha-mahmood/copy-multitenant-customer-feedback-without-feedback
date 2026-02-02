import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledCampaign, CampaignStatus } from './entities/scheduled-campaign.entity';
import { CreateScheduledCampaignDto } from './dto/create-scheduled-campaign.dto';
import { UpdateScheduledCampaignDto } from './dto/update-scheduled-campaign.dto';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CurrentUser } from 'src/common/decorators/current-user';
import { Inject } from '@nestjs/common';

@Controller('scheduled-campaigns')
@UseGuards(JwtAuthGuard)
export class ScheduledCampaignController {
  constructor(
    @Inject('SCHEDULED_CAMPAIGN_REPOSITORY')
    private scheduledCampaignRepository: Repository<ScheduledCampaign>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateScheduledCampaignDto,
  ) {
    try {
      // Validate merchant exists and is annual type
      const merchant = await this.merchantRepository.findOne({
        where: { id: createDto.merchant_id },
      });

      if (!merchant) {
        throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);
      }

      if (merchant.merchant_type !== 'annual') {
        throw new HttpException(
          'Only annual merchants can create scheduled campaigns',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if user is authorized to create campaign for this merchant
      if (user.role === 'merchant' && user.merchantId !== merchant.id) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      const campaign = this.scheduledCampaignRepository.create({
        ...createDto,
        status: CampaignStatus.SCHEDULED,
      });

      const saved = await this.scheduledCampaignRepository.save(campaign);

      return {
        success: true,
        message: 'Campaign scheduled successfully',
        data: saved,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create scheduled campaign',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('merchant_id') merchantId?: number,
    @Query('status') status?: CampaignStatus,
  ) {
    try {
      const query = this.scheduledCampaignRepository.createQueryBuilder('campaign');

      // Filter by merchant if specified
      if (merchantId) {
        query.where('campaign.merchant_id = :merchantId', { merchantId });

        // If merchant user, ensure they can only see their own campaigns
        if (user.role === 'merchant' && user.merchantId !== Number(merchantId)) {
          throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
        }
      } else if (user.role === 'merchant') {
        // Merchant users can only see their own campaigns
        query.where('campaign.merchant_id = :merchantId', { merchantId: user.merchantId });
      }

      // Filter by status if specified
      if (status) {
        query.andWhere('campaign.status = :status', { status });
      }

      query.orderBy('campaign.scheduled_date', 'DESC');

      const campaigns = await query.getMany();

      return {
        success: true,
        data: campaigns,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch campaigns',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: number) {
    try {
      const campaign = await this.scheduledCampaignRepository.findOne({
        where: { id },
        relations: ['merchant', 'coupon_batch'],
      });

      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }

      // Check authorization
      if (user.role === 'merchant' && user.merchantId !== campaign.merchant_id) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      return {
        success: true,
        data: campaign,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch campaign',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Body() updateDto: UpdateScheduledCampaignDto,
  ) {
    try {
      const campaign = await this.scheduledCampaignRepository.findOne({
        where: { id },
      });

      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }

      // Check authorization
      if (user.role === 'merchant' && user.merchantId !== campaign.merchant_id) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      // Don't allow updating campaigns that are already processing or completed
      if (
        campaign.status === CampaignStatus.PROCESSING ||
        campaign.status === CampaignStatus.COMPLETED
      ) {
        throw new HttpException(
          'Cannot update campaign that is processing or completed',
          HttpStatus.BAD_REQUEST,
        );
      }

      Object.assign(campaign, updateDto);
      const updated = await this.scheduledCampaignRepository.save(campaign);

      return {
        success: true,
        message: 'Campaign updated successfully',
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update campaign',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async cancel(@CurrentUser() user: any, @Param('id') id: number) {
    try {
      const campaign = await this.scheduledCampaignRepository.findOne({
        where: { id },
      });

      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }

      // Check authorization
      if (user.role === 'merchant' && user.merchantId !== campaign.merchant_id) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      // Only allow cancelling scheduled campaigns
      if (campaign.status !== CampaignStatus.SCHEDULED) {
        throw new HttpException(
          'Can only cancel campaigns that are scheduled',
          HttpStatus.BAD_REQUEST,
        );
      }

      campaign.status = CampaignStatus.CANCELLED;
      await this.scheduledCampaignRepository.save(campaign);

      return {
        success: true,
        message: 'Campaign cancelled successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to cancel campaign',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
