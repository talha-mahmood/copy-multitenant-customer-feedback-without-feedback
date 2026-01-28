import { PartialType } from '@nestjs/mapped-types';
import { CreateFinanceViewerDto } from './create-finance-viewer.dto';

export class UpdateFinanceViewerDto extends PartialType(CreateFinanceViewerDto) {}
