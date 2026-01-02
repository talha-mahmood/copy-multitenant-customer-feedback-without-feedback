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
import { CreatePresetReviewDto } from './dto/create-preset-review.dto';
import { UpdatePresetReviewDto } from './dto/update-preset-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('preset-reviews')
export class PresetReviewController {
  constructor(private readonly presetReviewService: PresetReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPresetReviewDto: CreatePresetReviewDto) {
    return this.presetReviewService.create(createPresetReviewDto);
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
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePresetReviewDto: UpdatePresetReviewDto,
  ) {
    return this.presetReviewService.update(+id, updatePresetReviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.presetReviewService.remove(+id);
  }
}
