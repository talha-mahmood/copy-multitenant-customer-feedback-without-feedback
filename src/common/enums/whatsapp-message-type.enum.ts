/**
 * WhatsApp Message Type Classification
 * 
 * User-Initiated (UI) - cheaper, triggered by user actions:
 * - Homepage "Get Coupon" clicks
 * - In-store customer QR scan flows
 * 
 * Business-Initiated (BI) - more expensive (10x+), triggered by system automation:
 * - Birthday campaigns
 * - Inactive customer recall
 * - Festival broadcasts
 * - Scheduled campaigns
 * 
 * IMPORTANT: Misclassification can destroy profit margins
 * Must be hard-coded by trigger source
 */
export enum WhatsAppMessageType {
  USER_INITIATED = 'UI', // User-triggered actions
  BUSINESS_INITIATED = 'BI', // System-automated campaigns
}

export enum WhatsAppMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum WhatsAppCampaignType {
  BIRTHDAY = 'birthday',
  INACTIVE_RECALL = 'inactive_recall',
  FESTIVAL = 'festival',
  CUSTOM = 'custom',
}
