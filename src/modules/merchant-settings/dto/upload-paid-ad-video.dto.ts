import { IsFile, MemoryStoredFile } from 'nestjs-form-data';
import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPaidAdVideoDto {
  @IsFile()
  paidAdVideo: MemoryStoredFile;

  @IsOptional()
  @IsString()
  paidAdPlacement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paidAdDuration?: number;

  @IsOptional()
  @IsDateString()
  paidAdStartDate?: string;
}
