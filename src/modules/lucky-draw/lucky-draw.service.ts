import { Injectable, Inject, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { Repository, MoreThan } from 'typeorm';
import { LuckyDrawPrize } from './entities/lucky-draw-prize.entity';
import { LuckyDrawResult } from './entities/lucky-draw-result.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponBatch } from '../coupon-batches/entities/coupon-batch.entity';
import { CreateLuckyDrawPrizeDto } from './dto/create-lucky-draw-prize.dto';
import { UpdateLuckyDrawPrizeDto } from './dto/update-lucky-draw-prize.dto';
import { SpinWheelDto } from './dto/spin-wheel.dto';
import { LUCKY_DRAW_PRIZE_REPOSITORY, LUCKY_DRAW_RESULT_REPOSITORY } from './lucky-draw.provider';
import { WhatsAppService } from 'src/common/services/whatsapp.service';
import { WalletService } from '../wallets/wallet.service';

@Injectable()
export class LuckyDrawService {
  constructor(
    @Inject(LUCKY_DRAW_PRIZE_REPOSITORY)
    private prizeRepository: Repository<LuckyDrawPrize>,
    @Inject(LUCKY_DRAW_RESULT_REPOSITORY)
    private resultRepository: Repository<LuckyDrawResult>,
    @Inject('CUSTOMER_REPOSITORY')
    private customerRepository: Repository<Customer>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('COUPON_REPOSITORY')
    private couponRepository: Repository<Coupon>,
    @Inject('COUPON_BATCH_REPOSITORY')
    private couponBatchRepository: Repository<CouponBatch>,
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
  ) { }

  async createPrize(createDto: CreateLuckyDrawPrizeDto) {
    // Validate total probabilities don't exceed 100
    const where: any = {
      merchant_id: createDto.merchant_id,
      is_active: true,
    };

    if (createDto.batch_id) {
      where.batch_id = createDto.batch_id;
    }

    const existingPrizes = await this.prizeRepository.find({ where });

    const totalProbability = existingPrizes.reduce((sum, p) => sum + Number(p.probability), 0);
    if (totalProbability + createDto.probability > 100) {
      throw new BadRequestException(
        `Total probability would exceed 100%. Current: ${totalProbability}%, Adding: ${createDto.probability}%`,
      );
    }

    const prize = this.prizeRepository.create({
      merchant_id: createDto.merchant_id,
      batch_id: createDto.batch_id,
      prize_name: createDto.prize_name,
      prize_description: createDto.prize_description,
      prize_type: createDto.prize_type,
      probability: createDto.probability,
      daily_limit: createDto.daily_limit,
      total_limit: createDto.total_limit,
      is_active: createDto.is_active ?? true,
      sort_order: createDto.sort_order ?? 0,
      daily_count: 0,
      total_count: 0,
    });

    const saved = await this.prizeRepository.save(prize);

    return {
      message: 'Lucky draw prize created successfully',
      data: saved,
    };
  }

  async updatePrize(id: number, updateDto: UpdateLuckyDrawPrizeDto) {
    const prize = await this.prizeRepository.findOne({ where: { id } });

    if (!prize) {
      throw new NotFoundException('Prize not found');
    }

    // If updating probability, validate total doesn't exceed 100
    if (updateDto.probability !== undefined) {
      const otherPrizes = await this.prizeRepository.find({
        where: {
          merchant_id: prize.merchant_id,
          batch_id: prize.batch_id,
          is_active: true,
        },
      });

      const totalProbability = otherPrizes
        .filter((p) => p.id !== id)
        .reduce((sum, p) => sum + Number(p.probability), 0);

      if (totalProbability + updateDto.probability > 100) {
        throw new BadRequestException(
          `Total probability would exceed 100%. Current (excluding this): ${totalProbability}%, New: ${updateDto.probability}%`,
        );
      }
    }

    Object.assign(prize, updateDto);
    const updated = await this.prizeRepository.save(prize);

    return {
      message: 'Prize updated successfully',
      data: updated,
    };
  }

  async getPrize(id: number) {
    const prize = await this.prizeRepository.findOne({ where: { id } });

    if (!prize) {
      throw new NotFoundException('Prize not found');
    }

    return {
      message: 'Prize retrieved successfully',
      data: prize,
    };
  }

  async getAllPrizes(merchantId?: number, batchId?: number, isActive?: boolean, page: number = 1, pageSize: number = 20) {
    const where: any = {};

    if (merchantId !== undefined) {
      where.merchant_id = merchantId;
    }

    if (batchId !== undefined) {
      where.batch_id = batchId;
    }

    if (isActive !== undefined) {
      where.is_active = Boolean(isActive);
    }

    const skip = (page - 1) * pageSize;

    const [prizes, total] = await this.prizeRepository.findAndCount({
      where,
      order: { sort_order: 'ASC', created_at: 'DESC' },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      message: 'Prizes retrieved successfully',
      data: prizes,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  async findPrizesByMerchant(merchantId: number, batchId?: number) {
    const where: any = { merchant_id: merchantId, is_active: true };
    if (batchId) {
      where.batch_id = batchId;
    }

    const prizes = await this.prizeRepository.find({
      where,
      order: { sort_order: 'ASC', probability: 'DESC' },
    });

    return {
      message: 'Prizes retrieved successfully',
      data: prizes,
    };
  }

  async deletePrize(id: number) {
    const prize = await this.prizeRepository.findOne({ where: { id } });
    if (!prize) {
      throw new NotFoundException('Prize not found');
    }

    await this.prizeRepository.softDelete(id);

    return {
      message: 'Prize deleted successfully',
    };
  }

  async spinWheel(spinDto: SpinWheelDto) {
    // Get all active prizes for this batch
    const prizes = await this.prizeRepository.find({
      where: {
        merchant_id: spinDto.merchant_id,
        is_active: true,
      },
      order: { probability: 'DESC' },
    });

    if (prizes.length === 0) {
      throw new BadRequestException('No prizes configured for this lucky draw');
    }

    // Filter out prizes that have reached their limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availablePrizes = prizes.filter((prize) => {
      // Check total limit
      if (prize.total_limit && prize.total_count >= prize.total_limit) {
        return false;
      }
      // Check daily limit
      if (prize.daily_limit && prize.daily_count >= prize.daily_limit) {
        return false;
      }
      return true;
    });

    if (availablePrizes.length === 0) {
      throw new BadRequestException('All prizes have reached their limits');
    }

    // Normalize probabilities if some prizes are unavailable
    const totalProbability = availablePrizes.reduce((sum, p) => sum + Number(p.probability), 0);
    const normalizedPrizes = availablePrizes.map((p) => ({
      ...p,
      normalizedProbability: (Number(p.probability) / totalProbability) * 100,
    }));

    // Spin the wheel
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    let wonPrize: typeof normalizedPrizes[0] | null = null;

    for (const prize of normalizedPrizes) {
      cumulativeProbability += prize.normalizedProbability;
      if (random <= cumulativeProbability) {
        wonPrize = prize;
        break;
      }
    }

    if (!wonPrize) {
      wonPrize = normalizedPrizes[normalizedPrizes.length - 1]; // Fallback to last prize
    }

    // // Update prize counts
    // await this.prizeRepository.update(wonPrize.id, {
    //   daily_count: wonPrize.daily_count + 1,
    //   total_count: wonPrize.total_count + 1,
    // });

    // // Create result record
    // const result = this.resultRepository.create({
    //   customer_id: spinDto.customer_id,
    //   merchant_id: spinDto.merchant_id,
    //   batch_id: spinDto.batch_id,
    //   prize_id: wonPrize.id,
    //   spin_date: new Date(),
    //   is_claimed: false,
    // });

    // const savedResult = await this.resultRepository.save(result);

    // // Load result with prize details
    // const resultWithPrize = await this.resultRepository.findOne({
    //   where: { id: savedResult.id },
    //   relations: ['prize'],
    // });

    // Find and send coupon if prize has batch_id
    let coupon: Coupon | null = null;
    let whatsappSent = false;

    if (wonPrize.batch_id && wonPrize.prize_type === 'coupon') {
      // Find an available coupon with status='created' from the prize's batch
      coupon = await this.couponRepository.findOne({
        where: {
          batch_id: wonPrize.batch_id,
          status: 'created',
        },
        order: { created_at: 'ASC' }, // Get oldest created coupon first
      });

      if (coupon) {
        
        // Get customer and merchant details
        const customer = await this.customerRepository.findOne({
          where: { id: spinDto.customer_id },
        });

        const merchant = await this.merchantRepository.findOne({
          where: { id: spinDto.merchant_id },
        });

        const batch = await this.couponBatchRepository.findOne({
          where: { id: wonPrize.batch_id },
        });

        // Check if batch exists and is not expired
        if (!batch) {
          throw new BadRequestException('Coupon batch not found for the won prize');
        }

        const currentDate = new Date();
        const batchEndDate = new Date(batch.end_date);
        
        // Compare dates by converting to time (milliseconds)
        if (batchEndDate.getTime() < currentDate.getTime()) {
          throw new BadRequestException('The coupon batch for the won prize has expired');
        }

        // Update prize counts
        await this.prizeRepository.update(wonPrize.id, {
          daily_count: wonPrize.daily_count + 1,
          total_count: wonPrize.total_count + 1,
        });

        // Create result record
        const result = this.resultRepository.create({
          customer_id: spinDto.customer_id,
          merchant_id: spinDto.merchant_id,
          batch_id: wonPrize.batch_id,
          prize_id: wonPrize.id,
          spin_date: new Date(),
          is_claimed: false,
        });

        const savedResult = await this.resultRepository.save(result);

        // Load result with prize details
        const resultWithPrize = await this.resultRepository.findOne({
          where: { id: savedResult.id },
          relations: ['prize'],
        });


        if (customer && merchant && batch) {
          // Update coupon: assign to customer and mark as issued
          coupon.customer_id = customer.id;
          coupon.status = 'issued';
          coupon.issued_at = new Date();

          // Send coupon via WhatsApp
          if (customer.phone) {
            // Check if merchant has WhatsApp credits before sending
            const creditCheck = await this.walletService.checkMerchantCredits(
              merchant.id,
              'whatsapp message',
              1,
            );

            if (creditCheck.hasCredits) {
              const expiryDate = new Date(batch.end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              const message = `Hello ${customer.name}, congratulations on winning a coupon from ${merchant.business_name}! With coupon code ${coupon.coupon_code} valid until ${expiryDate}. Please visit ${merchant.address || 'the merchant location'} to redeem your coupon.`;

              const whatsappResult = await this.whatsappService.sendGeneralMessage(
                customer.phone,
                message,
              );

              if (whatsappResult.success) {
                whatsappSent = true;
                coupon.whatsapp_sent = true;
                
                // Deduct WhatsApp credit after successful send
                await this.walletService.deductWhatsAppCredit(merchant.id, 1);
              }
            } else {
              // Log warning but don't block the lucky draw
              console.warn(`Merchant ${merchant.id} has insufficient WhatsApp credits. Available: ${creditCheck.availableCredits}`);
              throw new HttpException(`Merchant with business name ${merchant.business_name} has insufficient WhatsApp credits. Available: ${creditCheck.availableCredits}`, 500);
              
            }
          }

          // Save updated coupon
          await this.couponRepository.save(coupon);

          // Increment batch issued_quantity
          batch.issued_quantity += 1;
          await this.couponBatchRepository.save(batch);
        }


        return {
          message: 'Lucky draw completed successfully',
          data: {
            ...resultWithPrize,
            coupon: coupon ? {
              id: coupon.id,
              coupon_code: coupon.coupon_code,
              status: coupon.status,
              whatsapp_sent: coupon.whatsapp_sent,
            } : null,
            whatsapp_sent: whatsappSent,
          },
        };
      }
      else {
        // notify no coupons available
      throw new BadRequestException('No available coupons in the batch for the won prize');

      }
    }

    // return {
    //   message: 'Lucky draw completed successfully',
    //   data: {
    //     ...resultWithPrize,
    //     coupon: coupon ? {
    //       id: coupon.id,
    //       coupon_code: coupon.coupon_code,
    //       status: coupon.status,
    //       whatsapp_sent: coupon.whatsapp_sent,
    //     } : null,
    //     whatsapp_sent: whatsappSent,
    //   },
    // };
  }

  async getCustomerResults(customerId: number, merchantId?: number) {
    const where: any = { customer_id: customerId };
    if (merchantId) {
      where.merchant_id = merchantId;
    }

    const results = await this.resultRepository.find({
      where,
      relations: ['prize', 'merchant'],
      order: { spin_date: 'DESC' },
    });

    return {
      message: 'Results retrieved successfully',
      data: results,
    };
  }

  async claimPrize(resultId: number) {
    const result = await this.resultRepository.findOne({
      where: { id: resultId },
      relations: ['prize'],
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    if (result.is_claimed) {
      throw new BadRequestException('Prize already claimed');
    }

    result.is_claimed = true;
    result.claimed_at = new Date();
    await this.resultRepository.save(result);

    return {
      message: 'Prize claimed successfully',
      data: result,
    };
  }

  async resetDailyCounts() {
    // Called by cron job daily
    await this.prizeRepository.update({}, { daily_count: 0 });
    return { message: 'Daily counts reset successfully' };
  }
}
