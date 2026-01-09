import { IsOptional, IsDateString } from 'class-validator';

export class MerchantDashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface MerchantDashboardResponse {
  overview: {
    totalCouponsIssued: number;
    totalCouponsRedeemed: number;
    totalCouponsExpired: number;
    redemptionRate: number; // percentage
    whatsappMessagesSent: number;
    totalCustomers: number;
    returningCustomers: number;
    totalFeedbacks: number;
    luckyDrawParticipation: number;
  };
  couponStats: {
    byStatus: {
      created: number;
      issued: number;
      redeemed: number;
      expired: number;
    };
    byBatch: Array<{
      batchId: number;
      batchName: string;
      issued: number;
      redeemed: number;
      expired: number;
    }>;
  };
  feedbackStats: {
    totalReviews: number;
    presetReviews: number;
    customReviews: number;
    byPlatform: {
      google: number;
      facebook: number;
      instagram: number;
      xiaohongshu: number;
    };
    redirectCompletionRate: number; // percentage
  };
  luckyDrawStats: {
    totalSpins: number;
    totalPrizesWon: number;
    claimRate: number; // percentage
    prizeDistribution: Array<{
      prizeName: string;
      timesWon: number;
    }>;
  };
  customerStats: {
    newCustomersThisMonth: number;
    returningCustomersThisMonth: number;
    topCustomers: Array<{
      customerId: number;
      customerName: string;
      totalVisits: number;
      totalCouponsRedeemed: number;
    }>;
  };
  whatsappStats: {
    totalMessagesSent: number;
    couponDeliverySent: number;
    luckyDrawNotificationsSent: number;
    birthdayCouponsSent: number;
    inactiveRemindersSent: number;
    campaignMessagesSent: number;
    estimatedCost: number; // Based on message count
  };
  revenueImpact: {
    totalCouponsValue: number; // Sum of all coupon values
    redeemedCouponsValue: number;
    averageCouponValue: number;
  };
  timeline: {
    daily: Array<{
      date: string;
      couponsIssued: number;
      couponsRedeemed: number;
      feedbacksReceived: number;
      luckyDrawSpins: number;
    }>;
  };
}
