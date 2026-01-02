import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PresetReviewService } from './preset-review.service';
import { CreatePresetReviewDto, BulkCreatePresetReviewDto } from './dto/create-preset-review.dto';
import { UpdatePresetReviewDto, BulkUpdatePresetReviewDto } from './dto/update-preset-review.dto';
import { BulkDeletePresetReviewDto } from './dto/bulk-delete-preset-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('preset-reviews')
export class PresetReviewController {
  constructor(private readonly presetReviewService: PresetReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreatePresetReviewDto | BulkCreatePresetReviewDto) {
    // Check if it's a bulk create (array of reviews)
    if ('reviews' in body && Array.isArray(body.reviews)) {
      return this.presetReviewService.bulkCreate(body as BulkCreatePresetReviewDto);
    }
    // Otherwise treat as single create
    return this.presetReviewService.create(body as CreatePresetReviewDto);
  }

  @Get()
  findAll(
    @Query('merchantId') merchantId?: string,
    @Query('includeSystemDefaults') includeSystemDefaults?: string,
  ) {
    const merchantIdNum = merchantId ? parseInt(merchantId, 10) : undefined;
    const includeDefaults = includeSystemDefaults === 'true';
    return this.presetReviewService.findAll(merchantIdNum, includeDefaults);
  }

  @Get('seed-defaults')
  seedDefaults() {
    return this.presetReviewService.seedSystemDefaults();
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

  @UseGuards(JwtAuthGuard)
  @Delete()
  bulkDelete(@Body() bulkDeleteDto: BulkDeletePresetReviewDto) {
    return this.presetReviewService.bulkDelete(bulkDeleteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.presetReviewService.remove(+id);
  }
}
