import { IsOptional, IsString } from 'class-validator';

export class CreateHomepageAdRequestDto {
    @IsOptional()
    @IsString()
    ad_type?: string;

    @IsOptional()
    @IsString()
    ad_placement?: string;
}
