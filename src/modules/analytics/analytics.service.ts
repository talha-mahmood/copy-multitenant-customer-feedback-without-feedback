import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerchantAnalytics } from './entities/merchant-analytics.entity';
import { TrackImpressionDto } from './dto/track-impression.dto';
import { TrackClickDto } from './dto/track-click.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject('MERCHANT_ANALYTICS_REPOSITORY')
    private merchantAnalyticsRepository: Repository<MerchantAnalytics>,
  ) {}

  /**
   * Track an impression for a paid ad
   * Creates a new record or increments existing impression count
   */
  async trackImpression(trackImpressionDto: TrackImpressionDto) {
    const { merchantId, agentId, paidAdId } = trackImpressionDto;

    // Check if analytics record exists
    let analytics = await this.merchantAnalyticsRepository.findOne({
      where: {
        merchant_id: merchantId,
        admin_id: agentId,
        paid_ad_id: paidAdId,
      },
    });

    if (analytics) {
      // Increment impression count
      analytics.impressions += 1;
      await this.merchantAnalyticsRepository.save(analytics);
    } else {
      // Create new analytics record
      analytics = this.merchantAnalyticsRepository.create({
        merchant_id: merchantId,
        admin_id: agentId,
        paid_ad_id: paidAdId,
        impressions: 1,
        clicks: 0,
      });
      await this.merchantAnalyticsRepository.save(analytics);
    }

    return {
      success: true,
      message: 'Impression tracked successfully',
      data: {
        merchantId,
        agentId,
        paidAdId,
        impressions: analytics.impressions,
      },
    };
  }

  /**
   * Track a click for a paid ad
   * Creates a new record or increments existing click count
   */
  async trackClick(trackClickDto: TrackClickDto) {
    const { merchantId, agentId, paidAdId } = trackClickDto;

    // Check if analytics record exists
    let analytics = await this.merchantAnalyticsRepository.findOne({
      where: {
        merchant_id: merchantId,
        admin_id: agentId,
        paid_ad_id: paidAdId,
      },
    });

    if (analytics) {
      // Increment click count
      analytics.clicks += 1;
      await this.merchantAnalyticsRepository.save(analytics);
    } else {
      // Create new analytics record with a click
      analytics = this.merchantAnalyticsRepository.create({
        merchant_id: merchantId,
        admin_id: agentId,
        paid_ad_id: paidAdId,
        impressions: 0,
        clicks: 1,
      });
      await this.merchantAnalyticsRepository.save(analytics);
    }

    return {
      success: true,
      message: 'Click tracked successfully',
      data: {
        merchantId,
        agentId,
        paidAdId,
        clicks: analytics.clicks,
      },
    };
  }

  /**
   * Get analytics for a specific paid ad
   */
  async getAnalytics(merchantId: number, agentId: number, paidAdId: number) {
    const analytics = await this.merchantAnalyticsRepository.findOne({
      where: {
        merchant_id: merchantId,
        admin_id: agentId,
        paid_ad_id: paidAdId,
      },
    });

    if (!analytics) {
      return {
        success: true,
        data: {
          merchantId,
          agentId,
          paidAdId,
          impressions: 0,
          clicks: 0,
        },
      };
    }

    return {
      success: true,
      data: {
        merchantId,
        agentId,
        paidAdId,
        impressions: analytics.impressions,
        clicks: analytics.clicks,
      },
    };
  }

  /**
   * Get all analytics for a merchant
   */
  async getMerchantAnalytics(merchantId: number) {
    const analytics = await this.merchantAnalyticsRepository.find({
      where: { merchant_id: merchantId },
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get all analytics for an agent/admin
   */
  async getAgentAnalytics(agentId: number) {
    const analytics = await this.merchantAnalyticsRepository.find({
      where: { admin_id: agentId },
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: analytics,
    };
  }
}
