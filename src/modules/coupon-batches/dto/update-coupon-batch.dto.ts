import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponBatchDto } from './create-coupon-batch.dto';

export class UpdateCouponBatchDto extends PartialType(CreateCouponBatchDto) {}
