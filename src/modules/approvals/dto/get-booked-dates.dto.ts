import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GetBookedDatesDto {
    @IsString()
    placement: string; // 'top', 'bottom', 'left', 'right'

    @IsOptional()
    @IsDateString()
    startDate?: string; // Optional: for checking specific date range

    @IsOptional()
    @IsDateString()
    endDate?: string; // Optional: for checking specific date range
}

export interface BookedDateRange {
    startDate: Date;
    endDate: Date;
    approvalId: number;
    merchantId: number;
    status: string;
}
