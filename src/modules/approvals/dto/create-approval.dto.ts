import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateApprovalDto {
    @IsNotEmpty()
    @IsNumber()
    merchant_id: number;

    @IsOptional()
    @IsString()
    paid_ad_placement?: string;

    @IsOptional()
    @IsString()
    paid_ad_image?: string;

    @IsOptional()
    @IsBoolean()
    approval_status?: boolean;

    @IsOptional()
    @IsNumber()
    admin_id?: number;
}
