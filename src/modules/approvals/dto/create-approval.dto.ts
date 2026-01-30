import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

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

    @Exists(() => Admin, 'id', { message: 'Admin must exist' })
    @IsOptional()
    @IsNumber()
    admin_id?: number;
}
