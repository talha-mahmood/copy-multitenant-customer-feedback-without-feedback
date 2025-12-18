import * as bcrypt from 'bcrypt';

/**
 * Utility functions for MPIN handling
 */
export class MpinUtils {
  /**
   * Hash a 4-digit MPIN using bcrypt
   * @param mpin - 4-digit MPIN string
   * @returns Promise<string> - Hashed MPIN
   */
  static async hashMpin(mpin: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(mpin, saltRounds);
  }

  /**
   * Verify a 4-digit MPIN against its hash
   * @param mpin - 4-digit MPIN string
   * @param hashedMpin - Hashed MPIN from database
   * @returns Promise<boolean> - True if MPIN matches
   */
  static async verifyMpin(mpin: string, hashedMpin: string): Promise<boolean> {
    return await bcrypt.compare(mpin, hashedMpin);
  }

  /**
   * Validate MPIN format (4 digits)
   * @param mpin - MPIN string to validate
   * @returns boolean - True if valid format
   */
  static validateMpinFormat(mpin: string): boolean {
    const mpinRegex = /^\d{4}$/;
    return mpinRegex.test(mpin);
  }

  /**
   * Check if MPIN is set for a resident
   * @param hashedMpin - Hashed MPIN from database
   * @returns boolean - True if MPIN is set
   */
  static isMpinSet(hashedMpin: string | null): boolean {
    return hashedMpin !== null && hashedMpin.trim() !== '';
  }
}
