import { PartialType } from '@nestjs/mapped-types';
import { CreateAdApproverDto } from './create-ad-approver.dto';

export class UpdateAdApproverDto extends PartialType(CreateAdApproverDto) {}
