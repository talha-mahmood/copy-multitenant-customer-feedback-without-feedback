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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ShowCustomerDto } from './dto/show-customer.dto';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Public()
  @Get('check-by-phone')
  checkCustomerByPhone(
    @Query('phone') phone: string,
    @Query('merchant_id', ParseIntPipe) merchantId: number,
  ) {
    return this.customerService.checkCustomerByPhone(phone, merchantId);
  }

  @Public()
  @Post('claim-coupon')
  claimCoupon(@Body() claimCouponDto: ClaimCouponDto) {
    return this.customerService.claimCoupon(claimCouponDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    if (pageSize > 500) {
      throw new Error('Page size cannot be greater than 500');
    }
    return this.customerService.findAll(page, pageSize, search, user, isActive);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param() showCustomerDto: ShowCustomerDto) {
    return this.customerService.findOne(showCustomerDto.id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
}
