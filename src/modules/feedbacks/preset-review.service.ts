import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PresetReview } from './entities/preset-review.entity';
import { CreatePresetReviewDto } from './dto/create-preset-review.dto';
import { UpdatePresetReviewDto } from './dto/update-preset-review.dto';

@Injectable()
export class PresetReviewService {
  constructor(
    @Inject('PRESET_REVIEW_REPOSITORY')
    private presetReviewRepository: Repository<PresetReview>,
  ) {}

  async create(createPresetReviewDto: CreatePresetReviewDto) {
    const presetReview = this.presetReviewRepository.create({
      merchant_id: createPresetReviewDto.merchantId || null,
      review_text: createPresetReviewDto.reviewText,
      is_active: createPresetReviewDto.isActive ?? true,
      display_order: createPresetReviewDto.displayOrder ?? 0,
      is_system_default: !createPresetReviewDto.merchantId,
    });

    const saved = await this.presetReviewRepository.save(presetReview);

    return {
      message: 'Preset review created successfully',
      data: saved,
    };
  }

  async findAll(merchantId?: number, includeSystemDefaults: boolean = true) {
    const queryBuilder = this.presetReviewRepository
      .createQueryBuilder('preset_review')
      .where('preset_review.is_active = :isActive', { isActive: true })
      .orderBy('preset_review.display_order', 'ASC');

    if (merchantId) {
      if (includeSystemDefaults) {
        queryBuilder.andWhere(
          '(preset_review.merchant_id = :merchantId OR preset_review.is_system_default = :isSystemDefault)',
          { merchantId, isSystemDefault: true },
        );
      } else {
        queryBuilder.andWhere('preset_review.merchant_id = :merchantId', { merchantId });
      }
    } else {
      queryBuilder.andWhere('preset_review.is_system_default = :isSystemDefault', {
        isSystemDefault: true,
      });
    }

    const results = await queryBuilder.getMany();

    return {
      message: 'Preset reviews retrieved successfully',
      data: results,
    };
  }

  async findOne(id: number) {
    const presetReview = await this.presetReviewRepository.findOne({
      where: { id },
    });

    if (!presetReview) {
      throw new NotFoundException(`Preset review with ID ${id} not found`);
    }

    return {
      message: 'Preset review retrieved successfully',
      data: presetReview,
    };
  }

  async update(id: number, updatePresetReviewDto: UpdatePresetReviewDto) {
    const presetReview = await this.presetReviewRepository.findOne({
      where: { id },
    });

    if (!presetReview) {
      throw new NotFoundException(`Preset review with ID ${id} not found`);
    }

    // Don't allow editing system defaults
    if (presetReview.is_system_default) {
      throw new NotFoundException('Cannot edit system default preset reviews');
    }

    Object.assign(presetReview, {
      review_text: updatePresetReviewDto.reviewText ?? presetReview.review_text,
      is_active: updatePresetReviewDto.isActive ?? presetReview.is_active,
      display_order: updatePresetReviewDto.displayOrder ?? presetReview.display_order,
    });

    const updated = await this.presetReviewRepository.save(presetReview);

    return {
      message: 'Preset review updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const presetReview = await this.presetReviewRepository.findOne({
      where: { id },
    });

    if (!presetReview) {
      throw new NotFoundException(`Preset review with ID ${id} not found`);
    }

    // Don't allow deleting system defaults
    if (presetReview.is_system_default) {
      throw new NotFoundException('Cannot delete system default preset reviews');
    }

    await this.presetReviewRepository.softDelete(id);

    return {
      message: 'Preset review deleted successfully',
      data: null,
    };
  }

  async seedSystemDefaults() {
    const existingDefaults = await this.presetReviewRepository.count({
      where: { is_system_default: true },
    });

    if (existingDefaults > 0) {
      return {
        message: 'System default reviews already exist',
        data: null,
      };
    }

    const defaultReviews = [
      'Excellent service and great quality! Highly recommended!',
      'Amazing experience! Will definitely come back again.',
      'Outstanding service! The staff were very friendly and professional.',
      'Great value for money! Very satisfied with my purchase.',
      'Fantastic! Everything exceeded my expectations.',
      'Top-notch quality and service. Five stars!',
      'Wonderful experience from start to finish!',
      'Impressed with the attention to detail. Highly recommend!',
      'Best in town! You won\'t be disappointed.',
      'Exceptional service! Will recommend to all my friends.',
    ];

    const presetReviews = defaultReviews.map((text, index) =>
      this.presetReviewRepository.create({
        merchant_id: null,
        review_text: text,
        is_active: true,
        is_system_default: true,
        display_order: index + 1,
      }),
    );

    await this.presetReviewRepository.save(presetReviews);

    return {
      message: 'System default reviews seeded successfully',
      data: presetReviews,
    };
  }
}
