import * as fs from 'fs';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileUploadStorageType } from '../enums/file-upload-storage-type.enum';

const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export function saveToLocal(file: MemoryStoredFile | Express.Multer.File | any, fullFilePath: string) {
  try {
    const dir = path.dirname(fullFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Handle both memory storage (buffer) and disk storage (path)
    if (file.buffer) {
      fs.writeFileSync(fullFilePath, file.buffer);
    } else if (file.path) {
      // Copy file from temporary location to final location
      fs.copyFileSync(file.path, fullFilePath);
      // Delete the temporary file
      fs.unlinkSync(file.path);
    } else {
      throw new Error('File has neither buffer nor path property');
    }
    return;
  } catch (error) {
    throw new Error(`Failed to save file locally`, {
      cause: error,
    });
  }
}

export async function saveToS3(
  file: MemoryStoredFile | Express.Multer.File | any,
  constructedPath: string,
) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is not set');
  try {
    let fileBody;
    
    // Handle both memory storage (buffer) and disk storage (path)
    if (file.buffer) {
      fileBody = file.buffer;
    } else if (file.path) {
      fileBody = fs.readFileSync(file.path);
      // Delete the temporary file after reading
      fs.unlinkSync(file.path);
    } else {
      throw new Error('File has neither buffer nor path property');
    }

    const uploadResult = await s3
      .upload({
        Bucket: bucketName,
        Key: constructedPath,
        Body: fileBody,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();
  } catch (error) {
    throw new Error(`Failed to upload file to S3`, {
      cause: error,
    });
  }
}

export async function uploadFile(
  file: MemoryStoredFile | Express.Multer.File | any,
  moduleName: string,
  storage: FileUploadStorageType = FileUploadStorageType.LOCAL_STORAGE,
) {
  if (!file) {
    throw new Error('File is required for upload');
  }

  // Debug logging
  console.log('File upload - All file properties:', Object.keys(file));
  console.log('File upload - originalName:', file.originalName);
  console.log('File upload - originalname:', file.originalname);
  console.log('File upload - filename:', file.filename);

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const projectRoot = process.cwd();
  
  // Support both MemoryStoredFile (originalName) and Multer file (originalname)
  const originalFileName = file.originalName || file.originalname || file.filename || 'unnamed';
  const fileName = `${Date.now()}_${originalFileName}`;
  const dirPath = path.join(projectRoot, 'uploads', year, month, moduleName);
  const fullFilePath = path.join(dirPath, fileName);

  const relativePath = `/uploads/${year}/${month}/${moduleName}/${fileName}`;
  if (storage === FileUploadStorageType.S3) {
    const uploadDetails = await saveToS3(file, relativePath);
    return {
      relativePath,
      fileName,
    };
  } else {
    saveToLocal(file, fullFilePath);
    return {
      relativePath,
      fileName,
    };
  }
}