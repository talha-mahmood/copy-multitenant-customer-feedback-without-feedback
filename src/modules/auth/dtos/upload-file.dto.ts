import { IsNotEmpty, IsString } from "class-validator";
import { MemoryStoredFile, IsFile } from "nestjs-form-data";
import { IsAllowedFileType } from "src/common/decorators/is-allowed-file-type";
import { FileUploadType } from "src/common/enums/file-upload-type.enum";
export class UploadFileDto {
    @IsNotEmpty({ message: 'File field is required' })
    @IsFile({ message: 'File must be a valid file' })
    @IsAllowedFileType(
        [FileUploadType.IMAGE_PNG, FileUploadType.IMAGE_JPEG, FileUploadType.IMAGE_JPG],
        { message: 'Invalid file type' }
    )
    readonly file: MemoryStoredFile;
}