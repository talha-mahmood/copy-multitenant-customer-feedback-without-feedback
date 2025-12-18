import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionHelper {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.key = Buffer.from(this.configService.getOrThrow<string>('ENCRYPTION_KEY'), 'hex');
    this.iv = Buffer.from(this.configService.getOrThrow<string>('ENCRYPTION_SALT'), 'hex');
  }

  encrypt(text: string): string {
    if(!text) {
      throw new Error('Text to encrypt cannot be empty');
    }
    const cipher = createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encrypted: string): string {
    if(!encrypted) {
      throw new Error('Encrypted text cannot be empty');
    }
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}