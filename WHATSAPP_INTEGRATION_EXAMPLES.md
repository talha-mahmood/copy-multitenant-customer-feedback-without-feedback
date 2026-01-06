# WhatsApp Integration Examples

This file shows how to integrate WhatsApp notifications into existing modules.

## Example 1: Send Coupon Notification When Coupon is Created

**File:** `src/modules/coupons/coupon.service.ts`

```typescript
import { Injectable, Inject, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
// ... other imports

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    private readonly whatsAppService: WhatsAppService, // Inject WhatsApp service
    // ... other dependencies
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const coupon = this.couponRepository.create(createCouponDto);
    await this.couponRepository.save(coupon);

    // Send WhatsApp notification if customer has phone number
    if (coupon.customer?.phone_number) {
      try {
        const result = await this.whatsAppService.sendCouponNotification(
          coupon.customer.phone_number,
          coupon.customer.name || 'Customer',
          coupon.code,
          coupon.merchant?.business_name || 'Merchant',
          coupon.qr_code_image || ''
        );

        if (result.success) {
          this.logger.log(
            `Coupon notification sent to ${coupon.customer.phone_number}. Message ID: ${result.messageId}`
          );
        } else {
          this.logger.warn(
            `Failed to send coupon notification: ${result.error}`
          );
        }
      } catch (error) {
        this.logger.error('Error sending WhatsApp notification:', error);
        // Don't fail coupon creation if WhatsApp fails
      }
    }

    return coupon;
  }
}
```

## Example 2: Send Feedback Reminder After Customer Visit

**File:** `src/modules/feedbacks/feedback.service.ts`

```typescript
import { Injectable, Inject, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
import { ConfigService } from '@nestjs/config';
// ... other imports

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private feedbackRepository: Repository<Feedback>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    private readonly whatsAppService: WhatsAppService,
    private readonly configService: ConfigService,
    // ... other dependencies
  ) {}

  async sendFeedbackReminder(customerId: number, merchantId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!customer || !merchant) {
      throw new Error('Customer or Merchant not found');
    }

    if (!customer.phone_number) {
      this.logger.warn(`Customer ${customerId} has no phone number`);
      return { success: false, error: 'No phone number' };
    }

    // Generate feedback link
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    const feedbackLink = `${frontendUrl}/feedback/${merchantId}?customer=${customerId}`;

    try {
      const result = await this.whatsAppService.sendFeedbackReminder(
        customer.phone_number,
        customer.name || 'Customer',
        merchant.business_name || 'Merchant',
        feedbackLink
      );

      if (result.success) {
        this.logger.log(
          `Feedback reminder sent to ${customer.phone_number}. Message ID: ${result.messageId}`
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Error sending feedback reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // You can also automatically send feedback reminder when a feedback is created
  async create(createFeedbackDto: CreateFeedbackDto) {
    const feedback = this.feedbackRepository.create(createFeedbackDto);
    await this.feedbackRepository.save(feedback);

    // Send reminder after 1 day (implement with a scheduler)
    // For now, you can manually trigger it or use cron jobs

    return feedback;
  }
}
```

## Example 3: Send Prize Notification When Customer Wins Lucky Draw

**File:** `src/modules/lucky-draw/lucky-draw.service.ts`

```typescript
import { Injectable, Inject, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
// ... other imports

@Injectable()
export class LuckyDrawService {
  private readonly logger = new Logger(LuckyDrawService.name);

  constructor(
    @Inject('LUCKY_DRAW_RESULT_REPOSITORY')
    private luckyDrawResultRepository: Repository<LuckyDrawResult>,
    @Inject('LUCKY_DRAW_PRIZE_REPOSITORY')
    private luckyDrawPrizeRepository: Repository<LuckyDrawPrize>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async spinWheel(customerId: number, batchId?: number, merchantId?: number) {
    // ... existing spin logic ...
    
    const prize = await this.selectPrize(batchId, merchantId);
    
    const result = this.luckyDrawResultRepository.create({
      customer_id: customerId,
      prize_id: prize.id,
      spin_date: new Date(),
      is_claimed: false,
    });
    await this.luckyDrawResultRepository.save(result);

    // Send WhatsApp notification if customer won a prize
    if (prize.prize_type !== 'no_prize') {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (customer?.phone_number) {
        try {
          const prizeDetails = this.formatPrizeDetails(prize);
          
          const whatsappResult = await this.whatsAppService.sendPrizeWonNotification(
            customer.phone_number,
            customer.name || 'Customer',
            prize.prize_name,
            prizeDetails
          );

          if (whatsappResult.success) {
            this.logger.log(
              `Prize notification sent to ${customer.phone_number}. Message ID: ${whatsappResult.messageId}`
            );
          } else {
            this.logger.warn(
              `Failed to send prize notification: ${whatsappResult.error}`
            );
          }
        } catch (error) {
          this.logger.error('Error sending WhatsApp prize notification:', error);
          // Don't fail the spin if WhatsApp fails
        }
      }
    }

    return result;
  }

  private formatPrizeDetails(prize: LuckyDrawPrize): string {
    const parts = [];
    
    if (prize.prize_value) {
      parts.push(`Value: ${prize.prize_value}`);
    }
    
    if (prize.prize_type === 'coupon' && prize.coupon_code) {
      parts.push(`Coupon Code: ${prize.coupon_code}`);
    }
    
    if (prize.prize_type === 'discount' && prize.discount_percentage) {
      parts.push(`Discount: ${prize.discount_percentage}%`);
    }
    
    parts.push('Claim your prize soon!');
    
    return parts.join(' | ');
  }

  async claimPrize(resultId: number, customerId: number) {
    const result = await this.luckyDrawResultRepository.findOne({
      where: { id: resultId, customer_id: customerId },
      relations: ['prize', 'customer'],
    });

    if (!result) {
      throw new Error('Prize result not found');
    }

    if (result.is_claimed) {
      throw new Error('Prize already claimed');
    }

    result.is_claimed = true;
    result.claimed_at = new Date();
    await this.luckyDrawResultRepository.save(result);

    // Send confirmation via WhatsApp
    if (result.customer?.phone_number) {
      try {
        await this.whatsAppService.sendTextMessage(
          result.customer.phone_number,
          `🎉 Congratulations! Your prize "${result.prize.prize_name}" has been claimed successfully. Show this message at the counter to redeem your prize!`
        );
      } catch (error) {
        this.logger.error('Error sending claim confirmation:', error);
      }
    }

    return result;
  }
}
```

## Example 4: Send OTP During Customer Registration

**File:** `src/modules/auth/auth.service.ts`

```typescript
import { Injectable, Inject, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../common/services/whatsapp.service';
// ... other imports

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    private readonly whatsAppService: WhatsAppService,
    // ... other dependencies
  ) {}

  async sendOTP(phoneNumber: string) {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database or cache (implement your own logic)
    // await this.storeOTP(phoneNumber, otpCode);
    
    try {
      const result = await this.whatsAppService.sendOTPMessage(
        phoneNumber,
        otpCode
      );

      if (result.success) {
        this.logger.log(
          `OTP sent to ${phoneNumber}. Message ID: ${result.messageId}`
        );
        return {
          success: true,
          message: 'OTP sent successfully',
          // Don't return OTP in production!
          // otp: otpCode, // Only for testing
        };
      } else {
        this.logger.error(`Failed to send OTP: ${result.error}`);
        // Fallback to SMS or email here
        return {
          success: false,
          message: 'Failed to send OTP via WhatsApp',
          error: result.error,
        };
      }
    } catch (error) {
      this.logger.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Error sending OTP',
        error: error.message,
      };
    }
  }

  async verifyOTP(phoneNumber: string, otpCode: string) {
    // Implement your OTP verification logic
    // const isValid = await this.checkOTP(phoneNumber, otpCode);
    // return isValid;
  }

  async register(registerDto: RegisterDto) {
    // Create user
    const user = await this.userRepository.save(registerDto);

    // Send welcome message
    if (registerDto.phone_number) {
      try {
        await this.whatsAppService.sendWelcomeMessage(
          registerDto.phone_number,
          registerDto.name || 'User'
        );
      } catch (error) {
        this.logger.error('Error sending welcome message:', error);
        // Don't fail registration if WhatsApp fails
      }
    }

    return user;
  }
}
```

## Example 5: Scheduled Feedback Reminders (Using Cron)

**File:** `src/modules/feedbacks/feedback-scheduler.service.ts` (NEW FILE)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FeedbackService } from './feedback.service';
import { WhatsAppService } from '../../common/services/whatsapp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackSchedulerService {
  private readonly logger = new Logger(FeedbackSchedulerService.name);

  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly whatsAppService: WhatsAppService,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  // Run every day at 10 AM
  @Cron('0 10 * * *')
  async sendDailyFeedbackReminders() {
    this.logger.log('Starting daily feedback reminder job...');

    try {
      // Find customers who visited yesterday but haven't submitted feedback
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Your logic to find customers who need reminders
      // This is pseudo-code - adjust based on your schema
      
      const customers = await this.customerRepository
        .createQueryBuilder('customer')
        .leftJoin('customer.feedbacks', 'feedback')
        .where('customer.last_visit >= :yesterday', { yesterday })
        .andWhere('customer.last_visit < :today', { today })
        .andWhere('feedback.id IS NULL')
        .getMany();

      this.logger.log(`Found ${customers.length} customers to remind`);

      for (const customer of customers) {
        if (customer.phone_number) {
          try {
            await this.feedbackService.sendFeedbackReminder(
              customer.id,
              customer.last_merchant_id // You'll need to track this
            );
            
            // Add delay to avoid rate limiting
            await this.sleep(1000); // 1 second between messages
          } catch (error) {
            this.logger.error(
              `Failed to send reminder to customer ${customer.id}:`,
              error
            );
          }
        }
      }

      this.logger.log('Daily feedback reminder job completed');
    } catch (error) {
      this.logger.error('Error in feedback reminder job:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

Don't forget to add `ScheduleModule` to your module imports if using cron jobs!

## Notes

- All WhatsApp calls are wrapped in try-catch to prevent failures from breaking main functionality
- Use logging extensively to track WhatsApp delivery
- Don't fail main operations (coupon creation, registration, etc.) if WhatsApp fails
- Consider implementing a message queue for high-volume sending
- Add delays between messages to avoid rate limiting
- Store message IDs for tracking delivery status

## Testing

Always test with real phone numbers that are registered in your WhatsApp Business account's test numbers list!
