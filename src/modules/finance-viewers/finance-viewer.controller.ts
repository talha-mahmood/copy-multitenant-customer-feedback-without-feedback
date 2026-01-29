import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FinanceViewerService } from './finance-viewer.service';
import { CreateFinanceViewerDto } from './dto/create-finance-viewer.dto';
import { UpdateFinanceViewerDto } from './dto/update-finance-viewer.dto';

@Controller('finance-viewers')
export class FinanceViewerController {
  constructor(private readonly financeViewerService: FinanceViewerService) {}

  @Post()
  create(@Body() createDto: CreateFinanceViewerDto) {
    return this.financeViewerService.create(createDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.financeViewerService.findAll(page, pageSize, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financeViewerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFinanceViewerDto,
  ) {
    return this.financeViewerService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.financeViewerService.remove(id);
  }
}
