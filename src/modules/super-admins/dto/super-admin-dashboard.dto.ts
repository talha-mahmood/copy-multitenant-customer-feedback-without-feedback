import { IsOptional, IsDateString } from 'class-validator';

export class SuperAdminDashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface SuperAdminDashboardResponse {
  overview: {
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    totalMerchants: number;
    activeMerchants: number;
    inactiveMerchants: number;
    annualMerchants: number;
    temporaryMerchants: number;
    totalCustomers: number;
    totalCouponsIssued: number;
    totalCouponsRedeemed: number;
    totalFeedbackSubmissions: number;
  };
  revenue: {
    totalCommissions: number;
    annualSubscriptionRevenue: number;
    creditPurchaseRevenue: number;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      commissions: number;
    }>;
  };
  growth: {
    monthlyMerchants: Array<{
      month: string;
      newMerchants: number;
    }>;
    monthlyCustomers: Array<{
      month: string;
      newCustomers: number;
    }>;
  };
  topMerchants: Array<{
    merchantId: number;
    businessName: string;
    totalCouponsIssued: number;
    totalCouponsRedeemed: number;
  }>;
}