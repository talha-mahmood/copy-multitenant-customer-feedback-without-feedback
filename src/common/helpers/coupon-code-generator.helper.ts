import * as crypto from 'crypto';

export class CouponCodeGenerator {
  /**
   * Generate a unique coupon code with merchant prefix
   * Format: MERCHANTPREFIX-XXXXXXXX
   */
  static generate(merchantPrefix: string): string {
    const randomPart = this.generateRandomCode(8);
    return `${merchantPrefix.toUpperCase()}-${randomPart}`;
  }

  /**
   * Generate random alphanumeric code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars: I, O, 0, 1
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Validate coupon code format
   */
  static isValid(code: string): boolean {
    // Format: PREFIX-XXXXXXXX (at least 3 chars prefix, 8 chars code)
    const pattern = /^[A-Z]{3,}-[A-Z0-9]{8}$/;
    return pattern.test(code);
  }
}
