import { IsFile } from 'nestjs-form-data';
import { MemoryStoredFile } from 'nestjs-form-data';

export class UploadPaidAdImageDto {
  @IsFile()
  paidAdImage: MemoryStoredFile;
}
