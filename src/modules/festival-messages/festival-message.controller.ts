import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { FestivalMessageService } from './festival-message.service';
import { CreateFestivalMessageDto } from './dto/create-festival-message.dto';
import { UpdateFestivalMessageDto } from './dto/update-festival-message.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('festival-messages')
@UseGuards(JwtAuthGuard)
export class FestivalMessageController {
  constructor(private readonly festivalMessageService: FestivalMessageService) {}

  @Post()
  create(@Body() createDto: CreateFestivalMessageDto) {
    return this.festivalMessageService.create(createDto);
  }

  @Get()
  findAll(
    @Query('merchant_id') merchantId?: number,
    @Query('is_active', new DefaultValuePipe(true), ParseBoolPipe) isActive?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.festivalMessageService.findAll(merchantId, isActive, page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.festivalMessageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFestivalMessageDto,
  ) {
    return this.festivalMessageService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.festivalMessageService.remove(id);
  }
}
