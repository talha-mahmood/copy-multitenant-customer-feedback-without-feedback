import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export class QRCodeHelper {
  /**
   * Generate a signed hash for QR code to prevent tampering
   */
  static generateHash(merchantId: number, batchId: number, secret: string): string {
    const data = `${merchantId}:${batchId}`;
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify QR code hash
   */
  static verifyHash(
    merchantId: number,
    batchId: number,
    hash: string,
    secret: string,
  ): boolean {
    const expectedHash = this.generateHash(merchantId, batchId, secret);
    return hash === expectedHash;
  }

  /**
   * Generate QR code URL for a coupon batch
   */
  static generateQRCodeUrl(
    merchantId: number,
    batchId: number,
    baseUrl: string,
    secret: string,
  ): string {
    const hash = this.generateHash(merchantId, batchId, secret);
    return `${baseUrl}/review?mid=${merchantId}&bid=${batchId}&hash=${hash}`;
  }

  /**
   * Generate QR code image as Data URL (base64)
   */
  static async generateQRCodeImage(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code as buffer (for file storage)
   */
  static async generateQRCodeBuffer(url: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error.message}`);
    }
  }
}
