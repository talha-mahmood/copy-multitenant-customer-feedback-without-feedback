export enum SystemLogCategory {
  AUTH = 'auth',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  CUSTOMER = 'customer',
  COUPON = 'coupon',
  WHATSAPP = 'whatsapp',
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
  
  // WhatsApp
  MESSAGE_SENT = 'message_sent',
  MESSAGE_FAILED = 'message_failed',
  CAMPAIGN_TRIGGERED = 'campaign_triggered',
  
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
