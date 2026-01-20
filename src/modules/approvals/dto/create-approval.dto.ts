import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateApprovalDto {
    @IsNotEmpty()
    @IsNumber()
    merchant_id: number;

    @IsNotEmpty()
    @IsString()
    approval_type: string;

    @IsOptional()
    @IsString()
    approval_owner?: string;

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
    @IsNumber()
    admin_id?: number;
}
