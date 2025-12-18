import { PartialType } from '@nestjs/mapped-types';
import { CreateUserHasRoleDto } from './create-user-has-role.dto';

export class UpdateUserHasRoleDto extends PartialType(CreateUserHasRoleDto) {}
