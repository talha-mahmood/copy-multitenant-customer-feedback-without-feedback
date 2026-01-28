import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, MinLength } from 'class-validator';

export class CreateSuperadminRoleDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsOptional()
    @IsEnum(['support_staff', 'ad_approver', 'finance_viewer'])
    admin_role?: string;

    @IsOptional()
    @IsEnum(['support_staff', 'ad_approver', 'finance_viewer'])
    role?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
