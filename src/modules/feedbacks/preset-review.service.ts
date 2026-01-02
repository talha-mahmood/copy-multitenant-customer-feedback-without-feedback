import { Injectable, Inject, NotFoundException, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PresetReview } from './entities/preset-review.entity';
import { UpdatePresetReviewDto, BulkUpdatePresetReviewDto } from './dto/update-preset-review.dto';

@Injectable()
export class PresetReviewService {
  constructor(
    @Inject('PRESET_REVIEW_REPOSITORY')
    private presetReviewRepository: Repository<PresetReview>,
  ) {}

  async findAll(merchantId?: number) {
    // Always return system defaults since merchants can only edit those 10 preset reviews
    const results = await this.presetReviewRepository.find({
      where: { is_system_default: true },
      order: { display_order: 'ASC' },
    });

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

    // Allow editing system defaults - merchants can customize them
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

        // Allow editing system defaults - merchants can customize them
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
}
