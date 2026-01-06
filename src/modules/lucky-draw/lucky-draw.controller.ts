import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { LuckyDrawService } from './lucky-draw.service';
import { CreateLuckyDrawPrizeDto } from './dto/create-lucky-draw-prize.dto';
import { UpdateLuckyDrawPrizeDto } from './dto/update-lucky-draw-prize.dto';
import { SpinWheelDto } from './dto/spin-wheel.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('lucky-draw')
export class LuckyDrawController {
  constructor(private readonly luckyDrawService: LuckyDrawService) {}

  @UseGuards(JwtAuthGuard)
  @Post('prizes')
  createPrize(@Body() createDto: CreateLuckyDrawPrizeDto) {
    return this.luckyDrawService.createPrize(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('prizes/:id')
  updatePrize(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLuckyDrawPrizeDto,
  ) {
    return this.luckyDrawService.updatePrize(id, updateDto);
  }

  @Get('prizes')
  getAllPrizes(
    @Query('merchantId') merchantId?: number,
    @Query('batchId') batchId?: number,
    @Query('isActive') isActive?: boolean,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.luckyDrawService.getAllPrizes(merchantId, batchId, isActive, Number(page), Number(pageSize));
  }

  @Get('prizes/:id')
  getPrize(@Param('id', ParseIntPipe) id: number) {
    return this.luckyDrawService.getPrize(id);
  }

  @Get('prizes/merchant/:merchantId')
  findPrizesByMerchant(
    @Param('merchantId', ParseIntPipe) merchantId: number,
    @Query('batchId') batchId?: number,
  ) {
    return this.luckyDrawService.findPrizesByMerchant(merchantId, batchId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('prizes/:id')
  deletePrize(@Param('id', ParseIntPipe) id: number) {
    return this.luckyDrawService.deletePrize(id);
  }

  @Public()
  @Post('spin')
  spinWheel(@Body() spinDto: SpinWheelDto) {
    return this.luckyDrawService.spinWheel(spinDto);
  }

  @Get('results/customer/:customerId')
  getCustomerResults(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('merchantId') merchantId?: number,
  ) {
    return this.luckyDrawService.getCustomerResults(customerId, merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('results/:id/claim')
  claimPrize(@Param('id', ParseIntPipe) id: number) {
    return this.luckyDrawService.claimPrize(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-daily-counts')
  resetDailyCounts() {
    return this.luckyDrawService.resetDailyCounts();
  }
}
