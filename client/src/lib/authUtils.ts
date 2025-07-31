import { ApiError } from './queryClient';

/**
 * Check if an error is an unauthorized (401) error
 * Supports both ApiError instances and generic Error objects
 * 
 * @param error - Error to check
 * @returns True if error represents unauthorized access
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.isUnauthorized();
  }
  
  if (error instanceof Error) {
    return /^401[:|\s]|unauthorized/i.test(error.message);
  }
  
  return false;
}

/**
 * Check if an error is a forbidden (403) error
 * 
 * @param error - Error to check
 * @returns True if error represents forbidden access
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 403;
  }
  
  if (error instanceof Error) {
    return /^403[:|\s]|forbidden/i.test(error.message);
  }
  
  return false;
}

/**
 * Check if an error is a network-related error
 * 
 * @param error - Error to check
 * @returns True if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0 || error.isServerError();
  }
  
  if (error instanceof Error) {
    const networkErrorPatterns = [
      /network/i,
      /fetch/i,
      /connection/i,
      /timeout/i,
      /offline/i,
    ];
    
    return networkErrorPatterns.some(pattern => pattern.test(error.message));
  }
  
  return false;
}

/**
 * Check if an error should trigger an authentication redirect
 * 
 * @param error - Error to check
 * @returns True if error should trigger auth redirect
 */
export function shouldRedirectToAuth(error: unknown): boolean {
  return isUnauthorizedError(error);
}

/**
 * Extract user-friendly error message from any error
 * 
 * @param error - Error to extract message from
 * @param fallback - Fallback message if extraction fails
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (error instanceof ApiError) {
    // Remove status code prefix for cleaner user messages
    const message = error.message.replace(/^\d+:\s*/, '');
    
    // Provide user-friendly messages for common errors
    switch (error.status) {
      case 401:
        return 'You need to log in to continue';
      case 403:
        return 'You don\'t have permission to perform this action';
      case 404:
        return 'The requested resource could not be found';
      case 409:
        return 'This action conflicts with existing data';
      case 422:
        return 'Please check your input and try again';
      case 429:
        return 'Too many requests. Please wait a moment and try again';
      case 500:
        return 'Server error. Please try again later';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later';
      default:
        return message || fallback;
    }
  }
  
  if (error instanceof Error) {
    return error.message || fallback;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallback;
}

/**
 * Authentication token utilities
 */
export const authTokenUtils = {
  /**
   * Check if a token appears to be expired based on its structure
   * Note: This is a basic check and should not be used for security validation
   */
  isTokenExpired(token: string): boolean {
    try {
      // Basic JWT structure check
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      // Decode payload (basic check, not cryptographically secure)
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (!exp) return false;
      
      // Check if token is expired (with 30 second buffer)
      return Date.now() >= (exp * 1000) - 30000;
    } catch {
      return true; // If we can't parse it, consider it invalid
    }
  },

  /**
   * Extract user ID from token payload (if available)
   * Note: This is for client-side convenience only, never trust for security
   */
  getUserIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  },
};

/**
 * Authentication state utilities
 */
export const authStateUtils = {
  /**
   * Check if user object is valid and complete
   */
  isValidUser(user: unknown): boolean {
    return (
      typeof user === 'object' &&
      user !== null &&
      'id' in user &&
      'username' in user &&
      typeof (user as any).id === 'string' &&
      typeof (user as any).username === 'string'
    );
  },

  /**
   * Get user display name (first name + last name or username fallback)
   */
  getUserDisplayName(user: any): string {
    if (!user) return 'Unknown User';
    
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return user.username || 'Unknown User';
  },

  /**
   * Get user avatar URL with fallback
   */
  getUserAvatarUrl(user: any, fallback?: string): string {
    const avatar = user?.profileImageUrl || user?.avatar;
    
    if (avatar && typeof avatar === 'string') {
      return avatar;
    }
    
    // Fallback to gravatar or default
    if (fallback) {
      return fallback;
    }
    
    // Generate a simple avatar based on username initials
    const name = this.getUserDisplayName(user);
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
  },
};

export default {
  isUnauthorizedError,
  isForbiddenError,
  isNetworkError,
  shouldRedirectToAuth,
  getUserFriendlyErrorMessage,
  authTokenUtils,
  authStateUtils,
};