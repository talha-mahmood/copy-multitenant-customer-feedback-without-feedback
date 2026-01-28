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
import { SupportStaffService } from './support-staff.service';
import { CreateSupportStaffDto } from './dto/create-support-staff.dto';
import { UpdateSupportStaffDto } from './dto/update-support-staff.dto';

@Controller('support-staff')
export class SupportStaffController {
  constructor(private readonly supportStaffService: SupportStaffService) {}

  @Post()
  create(@Body() createDto: CreateSupportStaffDto) {
    return this.supportStaffService.create(createDto);
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
    return this.supportStaffService.findAll(page, pageSize, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportStaffService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSupportStaffDto,
  ) {
    return this.supportStaffService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportStaffService.remove(id);
  }
}
