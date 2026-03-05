import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, IsDecimal } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';

export class CreateApprovalDto {
    @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
    @IsNotEmpty()
    @IsNumber()
    merchant_id: number;

    @IsNotEmpty()
    @IsString()
    approval_type: string;

    @IsOptional()
    @IsString()
    approval_owner?: string;

    @Exists(() => Admin, 'id', { message: 'Admin must exist' })
    @IsOptional()
    @IsNumber()
    agent_id?: number;

    @IsOptional()
    @IsString()
    request_from?: string;

    @IsOptional()
    @IsString()
    approval_status?: string;

    @IsOptional()
    @IsString()
    ad_type?: string;

    @IsOptional()
    ad_created_at?: Date;

    @IsOptional()
    ad_expired_at?: Date;

    @Exists(() => Admin, 'id', { message: 'Admin must exist' })
    @IsOptional()
    @IsNumber()
    admin_id?: number;

    // Homepage push request fields
    @Exists(() => Coupon, 'id', { message: 'Coupon must exist' })
    @IsOptional()
    @IsNumber()
    coupon_id?: number;

    @IsOptional()
    @IsBoolean()
    forwarded_by_agent?: boolean;

    @IsOptional()
    @IsString()
    payment_status?: string;

    @IsOptional()
    @IsNumber()
    payment_amount?: number;

    @IsOptional()
    @IsString()
    payment_intent_id?: string;

    @IsOptional()
    @IsString()
    disapproval_reason?: string;
}
