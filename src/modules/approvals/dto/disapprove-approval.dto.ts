import { IsNotEmpty, IsString } from 'class-validator';

export class DisapproveApprovalDto {
    @IsNotEmpty()
    @IsString()
    reason: string;
}
