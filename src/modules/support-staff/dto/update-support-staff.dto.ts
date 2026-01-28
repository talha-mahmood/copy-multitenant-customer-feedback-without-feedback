import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportStaffDto } from './create-support-staff.dto';

export class UpdateSupportStaffDto extends PartialType(CreateSupportStaffDto) {}
