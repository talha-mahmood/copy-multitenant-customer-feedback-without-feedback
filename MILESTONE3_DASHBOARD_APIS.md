# Milestone 3 Dashboard & Approval APIs Documentation

## Overview
This document describes the dashboard analytics and approval flow APIs for Milestone 3 implementation.

## 🎯 Merchant Dashboard API

### Get Merchant Dashboard Analytics
Retrieve comprehensive analytics for a merchant including coupons, feedbacks, lucky draw, customers, and WhatsApp statistics.

**Endpoint:** `GET /merchants/:id/dashboard`

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2025-01-01")
- `endDate` (optional): ISO date string (e.g., "2025-12-31")

**Default Behavior:** Shows **all-time records** when date filters are not provided. Both startDate and endDate must be provided together for date filtering.

**Example Request:**
```bash
GET /merchants/123/dashboard?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {jwt_token}
```

**Response Structure:**
```json
{
  "message": "Dashboard analytics retrieved successfully",
  "data": {
    "overview": {
      "totalCouponsIssued": 150,
      "totalCouponsRedeemed": 120,
      "totalCouponsExpired": 10,
      "redemptionRate": 80.00,
      "whatsappMessagesSent": 150,
      "totalCustomers": 85,
      "returningCustomers": 25,
      "totalFeedbacks": 95,
      "luckyDrawParticipation": 45
    },
    "couponStats": {
      "byStatus": {
        "created": 20,
        "issued": 150,
        "redeemed": 120,
        "expired": 10
      },
      "byBatch": [
        {
          "batchId": 1,
          "batchName": "New Year Promo",
          "issued": 50,
          "redeemed": 40,
          "expired": 5
        }
      ]
    },
    "feedbackStats": {
      "totalReviews": 95,
      "presetReviews": 70,
      "customReviews": 25,
      "byPlatform": {
        "google": 40,
        "facebook": 30,
        "instagram": 20,
        "xiaohongshu": 5
      },
      "redirectCompletionRate": 85.50
    },
    "luckyDrawStats": {
      "totalSpins": 45,
      "totalPrizesWon": 35,
      "claimRate": 77.78,
      "prizeDistribution": [
        {
          "prizeName": "10% Discount Coupon",
          "timesWon": 20
        },
        {
          "prizeName": "Free Coffee",
          "timesWon": 15
        }
      ]
    },
    "customerStats": {
      "newCustomersThisMonth": 15,
      "returningCustomersThisMonth": 25,
      "topCustomers": [
        {
          "customerId": 1,
          "customerName": "John Doe",
          "totalVisits": 5,
          "totalCouponsRedeemed": 4
        }
      ]
    },
    "whatsappStats": {
      "totalMessagesSent": 150,
      "couponDeliverySent": 150,
      "luckyDrawNotificationsSent": 0,
      "birthdayCouponsSent": 0,
      "inactiveRemindersSent": 0,
      "campaignMessagesSent": 0,
      "estimatedCost": 7.50
    },
    "timeline": {
      "daily": [
        {
          "date": "2025-01-01",
          "couponsIssued": 5,
          "couponsRedeemed": 4,
          "feedbacksReceived": 6,
          "luckyDrawSpins": 2
        }
      ]
    }
  }
}
```

**Use Cases:**
- Merchant dashboard homepage
- Performance tracking
- Customer engagement insights
- Revenue impact analysis
- Marketing campaign effectiveness

---

## 🎯 Admin/Agent Dashboard API

### Get Admin Dashboard Analytics
Retrieve comprehensive analytics for platform-wide statistics including all merchants, revenue, commissions, and customer engagement.

**Endpoint:** `GET /admins/:id/dashboard`

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Default Behavior:** Shows **all-time records** when date filters are not provided. Both startDate and endDate must be provided together for date filtering.

**Example Request:**
```bash
GET /admins/1/dashboard?startDate=2025-01-01&endDate=2025-03-31
Authorization: Bearer {jwt_token}
```

**Response Structure:**
```json
{
  "message": "Admin dashboard analytics retrieved successfully",
  "data": {
    "overview": {
      "totalMerchants": 250,
      "activeMerchants": 220,
      "inactiveMerchants": 30,
      "temporaryMerchants": 180,
      "annualMerchants": 70,
      "totalRevenue": 89925.00,
      "totalCommissionsEarned": 89925.00,
      "pendingApprovals": {
        "merchants": 5,
        "agents": 2
      }
    },
    "merchantStats": {
      "byType": {
        "temporary": 180,
        "annual": 70
      },
      "byStatus": {
        "active": 220,
        "inactive": 30
      },
      "recentlyAdded": [
        {
          "merchantId": 245,
          "businessName": "Coffee House",
          "merchantType": "temporary",
          "createdAt": "2025-01-15T10:30:00Z"
        }
      ],
      "topPerformers": [
        {
          "merchantId": 100,
          "businessName": "Best Restaurant",
          "totalCouponsIssued": 500,
          "totalCouponsRedeemed": 450,
          "totalRevenue": 0
        }
      ]
    },
    "revenueStats": {
      "totalRevenue": 89925.00,
      "annualSubscriptionRevenue": 83925.00,
      "creditPurchaseRevenue": 6000.00,
      "commissionsEarned": 89925.00,
      "breakdown": {
        "annualFees": 83925.00,
        "creditSales": 6000.00,
        "whatsappCharges": 0
      },
      "monthlyRevenue": [
        {
          "month": "2025-01",
          "revenue": 25000.00,
          "commissionsEarned": 25000.00
        }
      ]
    },
    "walletStats": {
      "totalBalance": 75000.00,
      "totalEarnings": 89925.00,
      "totalSpent": 14925.00,
      "pendingAmount": 0,
      "transactions": {
        "total": 150,
        "completed": 145,
        "pending": 3,
        "failed": 2
      }
    },
    "couponStats": {
      "totalCouponsIssued": 15000,
      "totalCouponsRedeemed": 12000,
      "redemptionRate": 80.00,
      "byMerchant": [
        {
          "merchantId": 100,
          "businessName": "Best Restaurant",
          "issued": 500,
          "redeemed": 450
        }
      ]
    },
    "whatsappStats": {
      "totalMessagesSent": 15000,
      "totalCost": 750.00,
      "averageCostPerMessage": 0.05,
      "byMerchant": [
        {
          "merchantId": 100,
          "businessName": "Best Restaurant",
          "messagesSent": 500,
          "estimatedCost": 25.00
        }
      ]
    },
    "customerEngagement": {
      "totalCustomers": 8500,
      "activeCustomers": 8500,
      "totalFeedbacks": 12000,
      "totalLuckyDrawParticipation": 5000,
      "averageFeedbacksPerMerchant": 54.55
    },
    "approvalQueue": {
      "pendingMerchants": [],
      "pendingAgents": []
    },
    "platformGrowth": {
      "newMerchantsThisMonth": 10,
      "newCustomersThisMonth": 0,
      "growthRate": 0,
      "timeline": [
        {
          "month": "2025-01",
          "newMerchants": 10,
          "newCustomers": 450,
          "revenue": 25000.00
        }
      ]
    }
  }
}
```

**Use Cases:**
- Admin/agent main dashboard
- Platform health monitoring
- Revenue tracking and forecasting
- Commission calculations
- Merchant performance overview

---

## 🗄️ Database Schema

### User Entity
All merchants and admin/agents have an associated User record with an `is_active` field:
- `is_active` BOOLEAN DEFAULT true - Controls whether the merchant/admin is active

To activate/deactivate:
- Update the `is_active` field in the users table for the associated user
- This automatically controls access for both merchants and admins

---

## 📊 Key Metrics Tracked

### Merchant Dashboard:
1. **Coupon Performance**: Issued, redeemed, expired counts & redemption rate
2. **Customer Engagement**: Total customers, returning customers, top customers
3. **Review Analytics**: Platform breakdown, preset vs custom, completion rate
4. **Lucky Draw Stats**: Total spins, prizes won, claim rate, prize distribution
5. **WhatsApp Usage**: Messages sent, estimated costs
6. **Timeline Data**: Daily trends for all activities

### Admin Dashboard:
1. **Platform Overview**: Total merchants by type and status
2. **Revenue Tracking**: Total revenue, commission breakdown, monthly trends
3. **Wallet Management**: Balance, earnings, transactions
4. **Merchant Performance**: Top performers, recent additions
5. **Customer Engagement**: Total customers, feedbacks, lucky draw participation
6. **Platform Growth**: Monthly growth trends, new merchants/customers
7. **Approval Queue**: Pending merchants and agents

---

## 🔐 Authentication & Authorization

All dashboard endpoints require:
- Valid JWT token in Authorization header
- Appropriate role permissions:
  - **Merchants**: Can only access their own dashboard
  - **Admins**: Can access admin dashboard
  
**User Activation:**
- Merchants and admins can be activated/deactivated via the `is_active` field in their associated user record
- Inactive users cannot access the system regardless of JWT token validity

---

## 💡 Implementation Notes

1. **Date Ranges**: All analytics support custom date ranges via query parameters
2. **Default Periods**:
   - Merchant dashboard: Last 30 days
   - User Activation**: Managed through `is_active` field in User entityance
4. **Cost Estimation**: WhatsApp costs calculated at $0.05 per message (configurable)
5. **Approval Flow**: Prevents double approval/rejection with status checks
6. **Existing Records**: Migration automatically approves all existing merchants/agents

---

## 🧪 Testing Checklist

- [ ] Test with active and inactive users
- [ ] Verify authorization for each endpoint
- [ ] Test with empty data sets
- [ ] Verify all SQL queries return correct datadata
- [ ] Test with empty data sets
- [ ] Verify authorization for each endpoint

---

## 📝 Postman Collection Examples

### Get Merchant Dashboard
```
GET {{base_url}}/merchants/{{merchant_id}}/dashboard?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {{token}}
```

### Get Admin Dashboard
```
GET {{base_url}}/admins/{{admin_id}}/dashboard?startDate=2025-01-01&endDate=2025-03-31
Authorization: Bearer {{token}}
```

###

## 🚀 Next Steps

1. Run the migration to add approval fields
2. Test all dashboard endpoints with real data
3. Update frontend to consume these APIs
4. Add email notifications for approvals/rejections (future enhancement)
5. Implement role-based guards for authorization
6. Add rate limiting for dashboard endpoints
7. Consider caching for frequently accessed metrics
Test all dashboard endpoints with real data
2. Update frontend to consume these APIs
3. Implement user activation/deactivation UI
4. Add role-based guards for authorization
5. Add rate limiting for dashboard endpoints
6