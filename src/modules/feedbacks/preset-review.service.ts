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
    if (!merchantId) {
      // If no merchantId, return system defaults
      const results = await this.presetReviewRepository.find({
        where: { is_system_default: true },
        order: { display_order: 'ASC' },
      });

      return {
        message: 'Preset reviews retrieved successfully',
        data: results,
      };
    }

    // Get all system defaults
    const systemDefaults = await this.presetReviewRepository.find({
      where: { is_system_default: true },
      order: { display_order: 'ASC' },
    });

    // Get merchant-specific customizations
    const merchantCustomizations = await this.presetReviewRepository.find({
      where: { merchant_id: merchantId, is_system_default: false },
    });

    // Create a map of customizations by display_order
    const customizationMap = new Map(
      merchantCustomizations.map(c => [c.display_order, c])
    );

    // For each system default, use merchant customization if available
    const results = systemDefaults.map(systemDefault => {
      const customization = customizationMap.get(systemDefault.display_order);
      return customization || systemDefault;
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

    if (!updatePresetReviewDto.merchant_id) {
      throw new HttpException('merchant_id is required to update preset reviews', 400);
    }

    // If updating a system default, create a merchant-specific copy
    if (presetReview.is_system_default) {
      // Check if merchant already has a customization for this display_order
      const existingCustomization = await this.presetReviewRepository.findOne({
        where: {
          merchant_id: updatePresetReviewDto.merchant_id,
          display_order: presetReview.display_order,
          is_system_default: false,
        },
      });

      if (existingCustomization) {
        // Update existing merchant customization
        Object.assign(existingCustomization, {
          review_text: updatePresetReviewDto.reviewText ?? existingCustomization.review_text,
          is_active: updatePresetReviewDto.isActive ?? existingCustomization.is_active,
        });
        const updated = await this.presetReviewRepository.save(existingCustomization);
        return {
          message: 'Preset review updated successfully',
          data: updated,
        };
      }

      // Create new merchant-specific copy
      const merchantCopy = this.presetReviewRepository.create({
        merchant_id: updatePresetReviewDto.merchant_id,
        review_text: updatePresetReviewDto.reviewText ?? presetReview.review_text,
        is_active: updatePresetReviewDto.isActive ?? presetReview.is_active,
        display_order: presetReview.display_order,
        is_system_default: false,
      });

      const saved = await this.presetReviewRepository.save(merchantCopy);
      return {
        message: 'Preset review customized successfully',
        data: saved,
      };
    }

    // If updating an existing merchant customization
    Object.assign(presetReview, {
      review_text: updatePresetReviewDto.reviewText ?? presetReview.review_text,
      is_active: updatePresetReviewDto.isActive ?? presetReview.is_active,
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
        if (!item.merchant_id) {
          errors.push({
            id: item.id,
            error: 'merchant_id is required',
          });
          continue;
        }

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

        // If updating a system default, create a merchant-specific copy
        if (presetReview.is_system_default) {
          // Check if merchant already has a customization for this display_order
          const existingCustomization = await this.presetReviewRepository.findOne({
            where: {
              merchant_id: item.merchant_id,
              display_order: presetReview.display_order,
              is_system_default: false,
            },
          });

          if (existingCustomization) {
            // Update existing merchant customization
            Object.assign(existingCustomization, {
              review_text: item.reviewText ?? existingCustomization.review_text,
              is_active: item.isActive ?? existingCustomization.is_active,
            });
            const updated = await this.presetReviewRepository.save(existingCustomization);
            results.push(updated);
            continue;
          }

          // Create new merchant-specific copy
          const merchantCopy = this.presetReviewRepository.create({
            merchant_id: item.merchant_id,
            review_text: item.reviewText ?? presetReview.review_text,
            is_active: item.isActive ?? presetReview.is_active,
            display_order: presetReview.display_order,
            is_system_default: false,
          });

          const saved = await this.presetReviewRepository.save(merchantCopy);
          results.push(saved);
          continue;
        }

        // If updating an existing merchant customization
        Object.assign(presetReview, {
          review_text: item.reviewText ?? presetReview.review_text,
          is_active: item.isActive ?? presetReview.is_active,
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
