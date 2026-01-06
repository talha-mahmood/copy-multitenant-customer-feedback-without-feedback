/**
 * Utility for generating cache-busting URLs for WhatsApp PDF delivery
 */
export class CacheBustingUtil {
  /**
   * Generates a cache-busting URL with multiple parameters to prevent WhatsApp caching
   * @param baseUrl - The base URL of the PDF
   * @param identifier - Unique identifier (invoice number, prescription number, etc.)
   * @returns URL with cache-busting parameters
   */
  static generateCacheBustedUrl(baseUrl: string, identifier: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = Buffer.from(`${identifier}-${timestamp}`).toString('base64').substring(0, 8);
    const microtime = process.hrtime.bigint().toString();
    
    // Multiple cache-busting parameters for maximum effectiveness
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${timestamp}&r=${random}&h=${hash}&_t=${new Date().getTime()}&_mt=${microtime}&_cb=${Math.floor(Math.random() * 1000000)}`;
  }

  /**
   * Generates cache-busting parameters as an object
   * @param identifier - Unique identifier for the resource
   * @returns Object with cache-busting parameters
   */
  static generateCacheBustingParams(identifier: string): Record<string, string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = Buffer.from(`${identifier}-${timestamp}`).toString('base64').substring(0, 8);
    const microtime = process.hrtime.bigint().toString();
    
    return {
      v: timestamp.toString(),
      r: random,
      h: hash,
      _t: new Date().getTime().toString(),
      _mt: microtime,
      _cb: Math.floor(Math.random() * 1000000).toString(),
    };
  }
}
