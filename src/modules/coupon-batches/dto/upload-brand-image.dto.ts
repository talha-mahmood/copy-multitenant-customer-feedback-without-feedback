import { IsFile, MemoryStoredFile } from 'nestjs-form-data';
import { IsOptional, IsString } from 'class-validator';

export class UploadBrandImageDto {
    @IsFile()
    brandImage: MemoryStoredFile;
}
