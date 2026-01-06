import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, MoreThan } from 'typeorm';
import { LuckyDrawPrize } from './entities/lucky-draw-prize.entity';
import { LuckyDrawResult } from './entities/lucky-draw-result.entity';
import { CreateLuckyDrawPrizeDto } from './dto/create-lucky-draw-prize.dto';
import { UpdateLuckyDrawPrizeDto } from './dto/update-lucky-draw-prize.dto';
import { SpinWheelDto } from './dto/spin-wheel.dto';
import { LUCKY_DRAW_PRIZE_REPOSITORY, LUCKY_DRAW_RESULT_REPOSITORY } from './lucky-draw.provider';

@Injectable()
export class LuckyDrawService {
  constructor(
    @Inject(LUCKY_DRAW_PRIZE_REPOSITORY)
    private prizeRepository: Repository<LuckyDrawPrize>,
    @Inject(LUCKY_DRAW_RESULT_REPOSITORY)
    private resultRepository: Repository<LuckyDrawResult>,
  ) {}

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
        batch_id: spinDto.batch_id,
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

    // Update prize counts
    await this.prizeRepository.update(wonPrize.id, {
      daily_count: wonPrize.daily_count + 1,
      total_count: wonPrize.total_count + 1,
    });

    // Create result record
    const result = this.resultRepository.create({
      customer_id: spinDto.customer_id,
      merchant_id: spinDto.merchant_id,
      batch_id: spinDto.batch_id,
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

    return {
      message: 'Lucky draw completed successfully',
      data: resultWithPrize,
    };
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
