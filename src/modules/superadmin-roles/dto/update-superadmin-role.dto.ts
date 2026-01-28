import { PartialType } from '@nestjs/mapped-types';
import { CreateSuperadminRoleDto } from './create-superadmin-role.dto';
import { IsOptional, MinLength } from 'class-validator';

export class UpdateSuperadminRoleDto extends PartialType(CreateSuperadminRoleDto) {
    @IsOptional()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password?: string;
}
