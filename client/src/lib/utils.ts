import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 * 
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // returns 'py-1 px-4' (px-2 is overridden)
 * cn('text-red-500', isActive && 'text-blue-500') // conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format number with appropriate suffixes (K, M, B)
 * Useful for displaying follower counts, like counts, etc.
 * 
 * @param num - Number to format
 * @param precision - Decimal places for formatted numbers (default: 1)
 * @returns Formatted string with suffix
 * 
 * @example
 * formatNumber(1234) // returns '1.2K'
 * formatNumber(1234567) // returns '1.2M'
 */
export function formatNumber(num: number, precision: number = 1): string {
  if (num < 1000) {
    return num.toString();
  }
  
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.log10(Math.abs(num)) / 3 | 0;
  
  if (tier === 0) return num.toString();
  
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  return scaled.toFixed(precision).replace(/\.0$/, '') + suffix;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * 
 * @param date - Date to format
 * @param locale - Locale for formatting (default: 'en')
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  // Handle future dates
  if (diffInSeconds < 0) {
    return 'just now';
  }
  
  const intervals = [
    { seconds: 31536000, unit: 'year' },
    { seconds: 2592000, unit: 'month' },
    { seconds: 604800, unit: 'week' },
    { seconds: 86400, unit: 'day' },
    { seconds: 3600, unit: 'hour' },
    { seconds: 60, unit: 'minute' },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(-count, interval.unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return 'just now';
}

/**
 * Debounce function to limit the rate of function execution
 * Useful for search inputs, resize handlers, etc.
 * 
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function to limit function execution to once per interval
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate a random ID string
 * Useful for temporary IDs, keys, etc.
 * 
 * @param length - Length of the ID (default: 8)
 * @returns Random string ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validate email format
 * 
 * @param email - Email string to validate
 * @returns True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format (alphanumeric, underscore, dot, 3-30 chars)
 * 
 * @param username - Username to validate
 * @returns True if username format is valid
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Truncate text to specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Deep clone an object (simple implementation for basic objects)
 * For complex objects, consider using a dedicated library like Lodash
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Sleep utility for async functions
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert file size in bytes to human readable format
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
