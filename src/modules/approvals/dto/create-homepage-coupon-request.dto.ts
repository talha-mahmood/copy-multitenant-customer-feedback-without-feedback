import { IsDateString, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

export class CreateHomepageCouponRequestDto {
    @ValidateIf((o) => !o.coupon_batch_id)
    @Exists(() => Coupon, 'id', { message: 'Coupon must exist' })
    @IsOptional()
    @IsNumber()
    coupon_id: number;

    @ValidateIf((o) => !o.coupon_id)
    @Exists(() => CouponBatch, 'id', { message: 'Coupon batch must exist' })
    @IsOptional()
    @IsNumber()
    coupon_batch_id: number;

    @IsOptional()
    @IsDateString()
    start_date?: string;
}
