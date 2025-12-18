import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Skip transformation for certain routes that might return binary data or complex objects
        if (this.shouldSkipTransformation(context)) {
          return data;
        }

        // Only transform if data exists and is an object
        if (data && typeof data === 'object') {
          return this.transformData(data);
        }
        return data;
      }),
    );
  }

  private transformData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformItem(item));
    }
    return this.transformItem(data);
  }

  private transformItem(item: any): any {
    if (item && typeof item === 'object') {
      // Skip transformation for objects that might contain Node.js internals
      if (this.containsNodeInternals(item)) {
        return item;
      }

      try {
        // Check if it has a 'data' property (common pattern in your services)
        if (item.data) {
          return {
            ...item,
            data: this.safeTransform(item.data),
          };
        }
        // If it's a direct entity, transform it
        return this.safeTransform(item);
      } catch (error) {
        // If transformation fails, return the original item
        console.warn('Transform failed, returning original data:', error.message);
        return item;
      }
    }
    return item;
  }

  private safeTransform(data: any): any {
    try {
      return instanceToPlain(data);
    } catch (error) {
      // If class-transformer fails, try to clean the object manually
      return this.cleanObject(data);
    }
  }

  private containsNodeInternals(obj: any): boolean {
    // Check for common Node.js internal properties
    const nodeInternalKeys = [
      '_events', '_eventsCount', '_maxListeners', 'socket', 'connection',
      '_handle', '_parent', '_connections', '_connectionKey', '_peername',
      '_server', '_httpMessage', '_req', '_res', '_onPendingData',
      'destroyed', 'readable', 'writable', '_readableState', '_writableState'
    ];

    for (const key of nodeInternalKeys) {
      if (key in obj) {
        return true;
      }
    }

    // Check if it's a function or has circular references
    if (typeof obj === 'function' || this.hasCircularReference(obj)) {
      return true;
    }

    return false;
  }

  private hasCircularReference(obj: any, seen = new WeakSet()): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    if (seen.has(obj)) {
      return true;
    }

    seen.add(obj);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (this.hasCircularReference(obj[key], seen)) {
          return true;
        }
      }
    }

    seen.delete(obj);
    return false;
  }

  private cleanObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip Node.js internal properties
      if (this.isNodeInternalKey(key)) {
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        if (this.containsNodeInternals(value)) {
          // Replace problematic objects with a safe representation
          cleaned[key] = '[Complex Object]';
        } else {
          cleaned[key] = this.cleanObject(value);
        }
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  private isNodeInternalKey(key: string): boolean {
    return key.startsWith('_') || 
           key === 'socket' || 
           key === 'connection' || 
           key === 'destroyed' ||
           key === 'readable' ||
           key === 'writable';
  }

  private shouldSkipTransformation(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Skip transformation for routes that might return binary data or complex objects
    const skipRoutes = [
      '/api/whatsapp-web/qr',           // Returns binary QR code image
      '/api/whatsapp-web/qr-data-url',  // Returns data URL
      '/api/whatsapp-web/web-ui',       // Returns HTML
      '/uploads/',                      // Static file serving
    ];

    // Check if the URL matches any skip routes
    for (const route of skipRoutes) {
      if (url.startsWith(route)) {
        return true;
      }
    }

    // Skip transformation for binary responses
    const response = context.switchToHttp().getResponse();
    const contentType = response.getHeader('content-type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('text/html')
    )) {
      return true;
    }

    return false;
  }
}
