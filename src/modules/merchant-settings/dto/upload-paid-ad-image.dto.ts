import { IsFile, MemoryStoredFile } from 'nestjs-form-data';
import { IsOptional, IsString } from 'class-validator';

export class UploadPaidAdImageDto {
  @IsFile()
  paidAdImage: MemoryStoredFile;

  @IsOptional()
  @IsString()
  paidAdPlacement?: string;
}
