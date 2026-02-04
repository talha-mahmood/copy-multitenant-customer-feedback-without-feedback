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
import { CurrentUser, User } from 'src/common/decorators/current-user';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ShowFeedbackDto } from './dto/show-feedback.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}
  @Public()
  @Post()
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('merchantId') merchantId?: number,
    @Query('customerId') customerId?: number,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.feedbackService.findAll(page, pageSize, merchantId, customerId, user);
  }

  // @Public()
  // @Get('check-customer-by-phone')
  // checkCustomerByPhone(@Query('phone') phone: string) {
  //   return this.feedbackService.checkCustomerByPhone(phone);
  // }

  @Get('analytics/:merchantId')
  getReviewAnalytics(@Param('merchantId', ParseIntPipe) merchantId: number) {
    return this.feedbackService.getReviewAnalytics(merchantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param() showFeedbackDto: ShowFeedbackDto) {
    return this.feedbackService.findOne(showFeedbackDto.id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.remove(id);
  }

  @Public()
  @Patch(':id/complete-redirect')
  markRedirectCompleted(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.markRedirectCompleted(id);
  }
}
