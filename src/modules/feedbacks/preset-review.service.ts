import { Injectable, Inject, NotFoundException, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PresetReview } from './entities/preset-review.entity';
import { CreatePresetReviewDto, BulkCreatePresetReviewDto } from './dto/create-preset-review.dto';
import { UpdatePresetReviewDto, BulkUpdatePresetReviewDto } from './dto/update-preset-review.dto';
import { BulkDeletePresetReviewDto } from './dto/bulk-delete-preset-review.dto';

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

  async bulkCreate(bulkCreateDto: BulkCreatePresetReviewDto) {
    const presetReviews = bulkCreateDto.reviews.map((dto) =>
      this.presetReviewRepository.create({
        merchant_id: dto.merchantId || null,
        review_text: dto.reviewText,
        is_active: dto.isActive ?? true,
        display_order: dto.displayOrder ?? 0,
        is_system_default: !dto.merchantId,
      }),
    );

    const saved = await this.presetReviewRepository.save(presetReviews);

    return {
      message: `${saved.length} preset reviews created successfully`,
      data: saved,
    };
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdatePresetReviewDto) {
    const results: PresetReview[] = [];
    const errors: Array<{ id: number; error: string }> = [];

    for (const item of bulkUpdateDto.reviews) {
      try {
        const presetReview = await this.presetReviewRepository.findOne({
          where: { id: item.id },
        });

        if (!presetReview) {
          errors.push({
            id: item.id,
            error: 'Preset review not found',
          });
          continue;
        }

        // Don't allow editing system defaults
        if (presetReview.is_system_default) {
          errors.push({
            id: item.id,
            error: 'Cannot edit system default preset reviews',
          });
          continue;
        }

        Object.assign(presetReview, {
          review_text: item.reviewText ?? presetReview.review_text,
          is_active: item.isActive ?? presetReview.is_active,
          display_order: item.displayOrder ?? presetReview.display_order,
        });

        const updated = await this.presetReviewRepository.save(presetReview);
        results.push(updated);
      } catch (error) {
        errors.push({
          id: item.id,
          error: error.message,
        });
      }
    }

    return {
      message: `${results.length} preset reviews updated successfully`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async bulkDelete(bulkDeleteDto: BulkDeletePresetReviewDto) {
    const results: number[] = [];
    const errors: Array<{ id: number; error: string }> = [];

    for (const id of bulkDeleteDto.ids) {
      try {
        const presetReview = await this.presetReviewRepository.findOne({
          where: { id },
        });

        if (!presetReview) {
          errors.push({
            id,
            error: 'Preset review not found',
          });
          continue;
        }

        // Don't allow deleting system defaults
        if (presetReview.is_system_default) {
          errors.push({
            id,
            error: 'Cannot delete system default preset reviews',
          });
          continue;
        }

        await this.presetReviewRepository.softDelete(id);
        results.push(id);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    return {
      message: `${results.length} preset reviews deleted successfully`,
      data: { deletedIds: results },
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
