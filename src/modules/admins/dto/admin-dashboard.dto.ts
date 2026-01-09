import { IsOptional, IsDateString } from 'class-validator';

export class AdminDashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface AdminDashboardResponse {
  overview: {
    totalMerchants: number;
    activeMerchants: number;
    inactiveMerchants: number;
    temporaryMerchants: number;
    annualMerchants: number;
    totalRevenue: number;
    totalCommissionsEarned: number;
    pendingApprovals: {
      merchants: number;
      agents: number;
    };
  };
  merchantStats: {
    byType: {
      temporary: number;
      annual: number;
    };
    byStatus: {
      active: number;
      inactive: number;
    };
    recentlyAdded: Array<{
      merchantId: number;
      businessName: string;
      merchantType: string;
      createdAt: string;
    }>;
    topPerformers: Array<{
      merchantId: number;
      businessName: string;
      totalCouponsIssued: number;
      totalCouponsRedeemed: number;
      totalRevenue: number;
    }>;
  };
  revenueStats: {
    totalRevenue: number;
    annualSubscriptionRevenue: number;
    creditPurchaseRevenue: number;
    commissionsEarned: number;
    breakdown: {
      annualFees: number;
      creditSales: number;
      whatsappCharges: number;
    };
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      commissionsEarned: number;
    }>;
  };
  walletStats: {
    totalBalance: number;
    totalEarnings: number;
    totalSpent: number;
    pendingAmount: number;
    transactions: {
      total: number;
      completed: number;
      pending: number;
      failed: number;
    };
  };
  couponStats: {
    totalCouponsIssued: number;
    totalCouponsRedeemed: number;
    redemptionRate: number;
    byMerchant: Array<{
      merchantId: number;
      businessName: string;
      issued: number;
      redeemed: number;
    }>;
  };
  whatsappStats: {
    totalMessagesSent: number;
    totalCost: number;
    averageCostPerMessage: number;
    byMerchant: Array<{
      merchantId: number;
      businessName: string;
      messagesSent: number;
      estimatedCost: number;
    }>;
  };
  customerEngagement: {
    totalCustomers: number;
    activeCustomers: number;
    totalFeedbacks: number;
    totalLuckyDrawParticipation: number;
    averageFeedbacksPerMerchant: number;
  };
  approvalQueue: {
    pendingMerchants: Array<{
      merchantId: number;
      businessName: number;
      email: string;
      requestedAt: string;
    }>;
    pendingAgents: Array<{
      agentId: number;
      name: string;
      email: string;
      requestedAt: string;
    }>;
  };
  platformGrowth: {
    newMerchantsThisMonth: number;
    newCustomersThisMonth: number;
    growthRate: number; // percentage
    timeline: Array<{
      month: string;
      newMerchants: number;
      newCustomers: number;
      revenue: number;
    }>;
  };
}
