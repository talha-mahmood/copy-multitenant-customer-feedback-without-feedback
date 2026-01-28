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
import { AdApproverService } from './ad-approver.service';
import { CreateAdApproverDto } from './dto/create-ad-approver.dto';
import { UpdateAdApproverDto } from './dto/update-ad-approver.dto';

@Controller('ad-approvers')
export class AdApproverController {
  constructor(private readonly adApproverService: AdApproverService) {}

  @Post()
  create(@Body() createDto: CreateAdApproverDto) {
    return this.adApproverService.create(createDto);
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
    return this.adApproverService.findAll(page, pageSize, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adApproverService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdApproverDto,
  ) {
    return this.adApproverService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adApproverService.remove(id);
  }
}
