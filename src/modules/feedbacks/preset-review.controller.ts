import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PresetReviewService } from './preset-review.service';
import { UpdatePresetReviewDto, BulkUpdatePresetReviewDto } from './dto/update-preset-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('preset-reviews')
export class PresetReviewController {
  constructor(private readonly presetReviewService: PresetReviewService) {}

  @Get()
  findAll(
    @Query('merchantId') merchantId?: string,
  ) {
    const merchantIdNum = merchantId ? parseInt(merchantId, 10) : undefined;
    return this.presetReviewService.findAll(merchantIdNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presetReviewService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdatePresetReviewDto) {
    return this.presetReviewService.bulkUpdate(bulkUpdateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePresetReviewDto: UpdatePresetReviewDto,
  ) {
    return this.presetReviewService.update(+id, updatePresetReviewDto);
  }
}
