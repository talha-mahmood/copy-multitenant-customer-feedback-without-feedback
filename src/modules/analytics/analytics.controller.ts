import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackImpressionDto } from './dto/track-impression.dto';
import { TrackClickDto } from './dto/track-click.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * POST /analytics/track-impression
   * Track an impression for a paid ad
   */
  @Public()
  @Post('track-impression')
  trackImpression(@Body() trackImpressionDto: TrackImpressionDto) {
    return this.analyticsService.trackImpression(trackImpressionDto);
  }

  /**
   * POST /analytics/track-click
   * Track a click for a paid ad
   */
  @Public()
  @Post('track-click')
  trackClick(@Body() trackClickDto: TrackClickDto) {
    return this.analyticsService.trackClick(trackClickDto);
  }

  /**
   * GET /analytics/:merchantId/:agentId/:paidAdId
   * Get analytics for a specific paid ad
   */
  @Get(':merchantId/:agentId/:paidAdId')
  getAnalytics(
    @Param('merchantId', ParseIntPipe) merchantId: number,
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('paidAdId', ParseIntPipe) paidAdId: number,
  ) {
    return this.analyticsService.getAnalytics(merchantId, agentId, paidAdId);
  }

  /**
   * GET /analytics/merchant/:merchantId
   * Get all analytics for a merchant
   */
  @Get('merchant/:merchantId')
  getMerchantAnalytics(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.analyticsService.getMerchantAnalytics(merchantId);
  }

  /**
   * GET /analytics/agent/:agentId
   * Get all analytics for an agent
   */
  @Get('agent/:agentId')
  getAgentAnalytics(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.analyticsService.getAgentAnalytics(agentId);
  }
}
