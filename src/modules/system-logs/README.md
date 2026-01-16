# System Logs Module

Comprehensive logging system for tracking all important activities across the platform.

## Overview

The System Logs module provides a centralized logging mechanism to track:
- User authentication activities
- Merchant operations
- Admin actions
- Coupon lifecycle events
- WhatsApp campaign activities
- Wallet transactions
- System events and errors

## Features

### Log Categories
- **AUTH**: Login, logout, registration
- **MERCHANT**: Merchant creation, updates, suspensions, renewals
- **ADMIN**: Admin operations
- **SUPER_ADMIN**: Super admin activities
- **CUSTOMER**: Customer-related events
- **COUPON**: Coupon creation, issuance, redemption, expiry
- **WHATSAPP**: WhatsApp message sending status
- **WALLET**: Credit additions, deductions, refunds
- **CAMPAIGN**: Automated campaign triggers (birthday, inactive customer)
- **PAYMENT**: Payment success/failure
- **SYSTEM**: System-level events, takeovers, errors

### Log Levels
- **INFO**: Normal operational messages
- **WARNING**: Warning messages (e.g., low credits)
- **ERROR**: Error events
- **CRITICAL**: Critical failures requiring immediate attention

## API Endpoints

### Get All Logs
```
GET /system-logs?page=1&pageSize=20
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 500)
- `category`: Filter by category (auth, merchant, coupon, etc.)
- `action`: Filter by action (login, create, redeem, etc.)
- `level`: Filter by level (info, warning, error, critical)
- `userId`: Filter by user ID
- `userType`: Filter by user type (super_admin, admin, merchant, customer)
- `entityType`: Filter by entity type (merchant, coupon, campaign)
- `entityId`: Filter by entity ID
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)

**Response:**
```json
{
  "message": "System logs retrieved successfully",
  "data": [
    {
      "id": 1,
      "category": "auth",
      "action": "login",
      "level": "info",
      "message": "User logged in successfully",
      "user_id": 5,
      "user_type": "merchant",
      "entity_type": null,
      "entity_id": null,
      "metadata": {
        "email": "merchant@example.com"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### Get Single Log
```
GET /system-logs/:id
```

## Usage in Services

### Example: Logging User Login

```typescript
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';

constructor(
  private systemLogService: SystemLogService,
) {}

async login(loginDto: LoginDto, req: Request) {
  // ... login logic ...
  
  await this.systemLogService.logAuth(
    SystemLogAction.LOGIN,
    user.id,
    roleName,
    `User ${user.email} logged in successfully`,
    { email: user.email, role: roleName },
    req.ip,
  );
  
  return response;
}
```

### Example: Logging Coupon Redemption

```typescript
await this.systemLogService.logCoupon(
  SystemLogAction.REDEEM,
  coupon.id,
  `Coupon ${coupon.coupon_code} redeemed by customer ${customer.name}`,
  {
    coupon_code: coupon.coupon_code,
    customer_id: customer.id,
    merchant_id: coupon.merchant_id,
  },
);
```

### Example: Logging WhatsApp Campaign

```typescript
await this.systemLogService.logWhatsApp(
  whatsappResult.success ? SystemLogAction.MESSAGE_SENT : SystemLogAction.MESSAGE_FAILED,
  `Birthday coupon sent to ${customer.phone}`,
  customer.id,
  {
    phone: customer.phone,
    coupon_code: coupon.coupon_code,
    campaign_type: 'birthday',
  },
);
```

### Example: Logging Wallet Transaction

```typescript
await this.systemLogService.logWallet(
  SystemLogAction.CREDIT_DEDUCT,
  `Deducted ${amount} credits for WhatsApp messages`,
  merchant.id,
  'merchant',
  amount,
  {
    transaction_type: 'whatsapp_message',
    messages_count: count,
  },
);
```

### Example: Logging System Events

```typescript
await this.systemLogService.logSystem(
  SystemLogAction.TAKEOVER,
  `Agent ${agentId} expired. Merchants transferred to main platform`,
  SystemLogLevel.CRITICAL,
  {
    agent_id: agentId,
    merchants_count: merchantCount,
  },
);
```

## Helper Methods

The SystemLogService provides convenient helper methods:

- `logAuth()` - For authentication events
- `logMerchant()` - For merchant operations
- `logCoupon()` - For coupon activities
- `logWhatsApp()` - For WhatsApp messages
- `logWallet()` - For wallet transactions
- `logCampaign()` - For automated campaigns
- `logSystem()` - For system-level events

## Access Control

- **Super Admin**: Can view all system logs
- **Admin**: Can only view logs related to their own operations
- **Merchant**: Cannot access system logs

## Database Schema

```sql
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  level VARCHAR(20) DEFAULT 'info',
  message TEXT NOT NULL,
  user_id INT,
  user_type VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
```

## Integration Points

To fully integrate system logging, add logging calls to:

1. **Auth Service**: Login, logout, registration
2. **Merchant Service**: Create, update, suspend, activate, renew
3. **Admin Service**: All admin operations
4. **Coupon Service**: Create batch, issue, redeem, expire
5. **WhatsApp Service**: Message sent/failed
6. **Wallet Service**: All credit transactions
7. **Birthday Message Service**: Campaign triggers
8. **Payment Service**: Stripe payment events

## Best Practices

1. **Be Specific**: Include relevant details in the message
2. **Use Metadata**: Store additional context in the metadata field
3. **Set Appropriate Levels**: Use WARNING for issues, ERROR for failures, CRITICAL for urgent problems
4. **Include User Context**: Always log userId and userType when available
5. **Entity Tracking**: Use entityType and entityId to track specific records
6. **Async Logging**: Logs are saved asynchronously and don't block operations

## Performance Considerations

- Logs are indexed for fast queries
- Use date range filters for large datasets
- Consider archiving old logs (> 1 year) to separate storage
- Monitor log table size and implement rotation if needed

## Future Enhancements

- [ ] Log archival/rotation system
- [ ] Export logs to CSV/JSON
- [ ] Real-time log streaming via WebSocket
- [ ] Alert system for critical events
- [ ] Log analytics dashboard
- [ ] Integration with external monitoring tools (Sentry, LogRocket, etc.)
