export enum SystemLogCategory {
  AUTH = 'auth',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  CUSTOMER = 'customer',
  COUPON = 'coupon',
  WHATSAPP = 'whatsapp', // Deprecated - use WHATSAPP_UI or WHATSAPP_BI
  WHATSAPP_UI = 'whatsapp_ui', // User-Initiated Messages
  WHATSAPP_BI = 'whatsapp_bi', // Business-Initiated Messages
  WALLET = 'wallet',
  CAMPAIGN = 'campaign',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}

export enum SystemLogAction {
  // Auth
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  
  // CRUD
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  
  // Merchant/Admin specific
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  RENEW = 'renew',
  EXPIRE = 'expire',
  
  // Coupon
  ISSUE = 'issue',
  REDEEM = 'redeem',
  REFUND = 'refund',
  BATCH_CREATE = 'batch_create',
  BATCH_EXPIRE = 'batch_expire',
  
  // WhatsApp - General
  MESSAGE_SENT = 'message_sent',
  MESSAGE_FAILED = 'message_failed',
  CAMPAIGN_TRIGGERED = 'campaign_triggered',
  
  // WhatsApp UI - User-Initiated Sources
  UI_FEEDBACK_SENT = 'ui_feedback_sent',
  UI_FEEDBACK_FAILED = 'ui_feedback_failed',
  UI_LUCKYDRAW_SENT = 'ui_luckydraw_sent',
  UI_LUCKYDRAW_FAILED = 'ui_luckydraw_failed',
  UI_HOMEPAGE_SENT = 'ui_homepage_sent',
  UI_HOMEPAGE_FAILED = 'ui_homepage_failed',
  
  // WhatsApp BI - Business-Initiated Campaigns
  BI_BIRTHDAY_SENT = 'bi_birthday_sent',
  BI_BIRTHDAY_FAILED = 'bi_birthday_failed',
  BI_INACTIVE_RECALL_SENT = 'bi_inactive_recall_sent',
  BI_INACTIVE_RECALL_FAILED = 'bi_inactive_recall_failed',
  BI_FESTIVAL_SENT = 'bi_festival_sent',
  BI_FESTIVAL_FAILED = 'bi_festival_failed',
  BI_CUSTOM_CAMPAIGN_SENT = 'bi_custom_campaign_sent',
  BI_CUSTOM_CAMPAIGN_FAILED = 'bi_custom_campaign_failed',
  
  // Wallet
  CREDIT_ADD = 'credit_add',
  CREDIT_DEDUCT = 'credit_deduct',
  CREDIT_REFUND = 'credit_refund',
  TOPUP = 'topup',
  
  // Payment
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  
  // System
  TAKEOVER = 'takeover',
  SYNC_REQUEST = 'sync_request',
  SYNC_APPROVE = 'sync_approve',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum SystemLogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}
