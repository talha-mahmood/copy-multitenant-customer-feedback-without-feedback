import { IsNotEmpty, IsNumber } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';

export class CreateHomepageCouponRequestDto {
    @Exists(() => Coupon, 'id', { message: 'Coupon must exist' })
    @IsNotEmpty()
    @IsNumber()
    coupon_id: number;
}
