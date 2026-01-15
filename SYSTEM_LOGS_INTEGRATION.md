# System Logs Integration Example

## Adding System Logs to Auth Module

Here's how to integrate system logging into the auth service:

### 1. Update auth.module.ts

```typescript
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({ ... }),
    SystemLogModule, // Add this
  ],
  // ...
})
export class AuthModule {}
```

### 2. Update auth.service.ts

```typescript
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';

@Injectable()
export class AuthService {
  constructor(
    // ... existing injections
    private systemLogService: SystemLogService, // Add this
  ) {}

  async login(loginDto: LoginDto, req?: Request) {
    // ... existing login logic ...

    // Add logging after successful login
    await this.systemLogService.logAuth(
      SystemLogAction.LOGIN,
      user.id,
      roleName,
      `User ${user.email} logged in successfully`,
      {
        email: user.email,
        role: roleName,
        merchantId,
        adminId,
        superAdminId,
      },
      req?.ip,
    );

    return response;
  }

  async register(registerDto: RegisterDto, req?: Request) {
    // ... existing register logic ...

    // Add logging after successful registration
    await this.systemLogService.logAuth(
      SystemLogAction.REGISTER,
      newUser.id,
      'customer', // or whatever role
      `New user registered: ${newUser.email}`,
      { email: newUser.email },
      req?.ip,
    );

    return response;
  }
}
```

### 3. Update auth.controller.ts to pass request object

```typescript
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    return this.authService.register(registerDto, req);
  }
}
```

## More Integration Examples

### Merchant Service

```typescript
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction, SystemLogCategory } from 'src/common/enums/system-log.enum';

async create(createMerchantDto: CreateMerchantDto) {
  // ... merchant creation logic ...

  await this.systemLogService.logMerchant(
    SystemLogAction.CREATE,
    savedMerchant.id,
    `Merchant created: ${createMerchantDto.business_name}`,
    createMerchantDto.admin_id,
    {
      business_name: createMerchantDto.business_name,
      merchant_type: createMerchantDto.merchant_type,
      admin_id: createMerchantDto.admin_id,
    },
  );

  return response;
}
```

### Coupon Service

```typescript
async redeemCoupon(couponCode: string, customerId: number) {
  // ... redemption logic ...

  await this.systemLogService.logCoupon(
    SystemLogAction.REDEEM,
    coupon.id,
    `Coupon ${couponCode} redeemed by customer ${customerId}`,
    {
      coupon_code: couponCode,
      customer_id: customerId,
      merchant_id: coupon.merchant_id,
      batch_id: coupon.batch_id,
    },
  );

  return response;
}
```

### WhatsApp Service

```typescript
async sendGeneralMessage(phone: string, message: string, merchantId?: number, customerId?: number) {
  try {
    const result = await this.sendToWhatsAppAPI(phone, message);

    await this.systemLogService.logWhatsApp(
      SystemLogAction.MESSAGE_SENT,
      `WhatsApp message sent to ${phone}`,
      customerId,
      {
        phone,
        merchant_id: merchantId,
        message_preview: message.substring(0, 50),
      },
    );

    return { success: true };
  } catch (error) {
    await this.systemLogService.logWhatsApp(
      SystemLogAction.MESSAGE_FAILED,
      `WhatsApp message failed to ${phone}: ${error.message}`,
      customerId,
      {
        phone,
        merchant_id: merchantId,
        error: error.message,
      },
    );

    throw error;
  }
}
```

### Wallet Service

```typescript
async deductWhatsAppCredit(merchantId: number, amount: number) {
  // ... deduction logic ...

  await this.systemLogService.logWallet(
    SystemLogAction.CREDIT_DEDUCT,
    `Deducted ${amount} WhatsApp credits from merchant ${merchantId}`,
    merchantId,
    'merchant',
    amount,
    {
      credit_type: 'whatsapp_message',
      previous_balance: wallet.whatsapp_message_credits,
      new_balance: wallet.whatsapp_message_credits - amount,
    },
  );

  return response;
}
```

### Birthday Campaign Service

```typescript
async sendBirthdayMessages() {
  const customers = await this.getCustomersWithUpcomingBirthdays();

  for (const customer of customers) {
    try {
      // ... send message logic ...

      await this.systemLogService.logCampaign(
        SystemLogAction.CAMPAIGN_TRIGGERED,
        `Birthday campaign triggered for customer ${customer.id}`,
        {
          campaign_type: 'birthday',
          customer_id: customer.id,
          merchant_id: customer.merchant_id,
          coupon_code: coupon.coupon_code,
        },
      );
    } catch (error) {
      await this.systemLogService.logSystem(
        SystemLogAction.ERROR,
        `Birthday campaign failed for customer ${customer.id}: ${error.message}`,
        SystemLogLevel.ERROR,
        {
          customer_id: customer.id,
          error: error.message,
        },
      );
    }
  }
}
```

## Testing

After integration, test by:

1. Login as different user types
2. Create merchants, coupons, etc.
3. View logs at: `GET /system-logs`
4. Filter logs: `GET /system-logs?category=auth&action=login`
5. Check specific log: `GET /system-logs/:id`

## Monitoring

Set up alerts for:
- Critical level logs
- High error rates
- Failed WhatsApp messages
- Low credit warnings
- Agent expiry warnings
