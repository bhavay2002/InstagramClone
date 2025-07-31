import { QueryClient, QueryFunction, DefaultOptions } from "@tanstack/react-query";

/**
 * HTTP status codes for common responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Enhanced error class for API requests with additional context
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;
  public readonly method: string;
  public readonly response?: Response;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    method: string,
    response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.method = method;
    this.response = response;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a specific HTTP status
   */
  isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if error is unauthorized (401)
   */
  isUnauthorized(): boolean {
    return this.status === HTTP_STATUS.UNAUTHORIZED;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Enhanced response validation with better error handling
 */
async function throwIfResNotOk(res: Response, url: string, method: string): Promise<void> {
  if (!res.ok) {
    let errorMessage: string;
    
    try {
      // Try to parse error response as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || res.statusText;
      } else {
        // Fallback to text response
        errorMessage = (await res.text()) || res.statusText;
      }
    } catch {
      // If parsing fails, use status text
      errorMessage = res.statusText || `HTTP ${res.status}`;
    }

    throw new ApiError(
      `${res.status}: ${errorMessage}`,
      res.status,
      res.statusText,
      url,
      method,
      res
    );
  }
}

/**
 * Request timeout configuration
 */
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Create fetch request with timeout and proper error handling
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        `Request timeout after ${timeoutMs}ms`,
        0,
        'Request Timeout',
        url,
        options.method || 'GET'
      );
    }
    
    throw error;
  }
}

/**
 * Enhanced API request function with better error handling and type safety
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // Add content type for requests with body
  if (data !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method: method.toUpperCase(),
    headers,
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetchWithTimeout(url, options);
    await throwIfResNotOk(response, url, method);
    return response;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Convert other errors to ApiError for consistency
    if (error instanceof Error) {
      throw new ApiError(
        error.message,
        0,
        'Network Error',
        url,
        method
      );
    }
    
    // Fallback for unknown errors
    throw new ApiError(
      'Unknown error occurred',
      0,
      'Unknown Error',
      url,
      method
    );
  }
}

/**
 * Behavior for handling 401 unauthorized responses
 */
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Options for query function configuration
 */
interface QueryFnOptions {
  on401: UnauthorizedBehavior;
  timeout?: number;
}

/**
 * Create a query function with configurable 401 handling
 */
export function getQueryFn<T>(options: QueryFnOptions): QueryFunction<T> {
  const { on401: unauthorizedBehavior, timeout = REQUEST_TIMEOUT } = options;
  
  return async ({ queryKey, signal }) => {
    const url = queryKey[0] as string;
    
    try {
      const response = await fetchWithTimeout(
        url,
        {
          credentials: 'include',
          signal,
        },
        timeout
      );

      // Handle 401s based on configuration
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        // If "throw", let throwIfResNotOk handle it
      }

      await throwIfResNotOk(response, url, 'GET');
      return await response.json();
    } catch (error) {
      // Special handling for 401 with returnNull behavior
      if (error instanceof ApiError && 
          error.status === HTTP_STATUS.UNAUTHORIZED && 
          unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      throw error;
    }
  };
}

/**
 * Default query client configuration optimized for the Instagram clone
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.isClientError()) {
        return false;
      }
      
      // Retry up to 3 times for server errors and network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 10000);
    },
    networkMode: 'online',
  },
  mutations: {
    retry: (failureCount: number, error: unknown) => {
      // Only retry mutations on server errors, not client errors
      if (error instanceof ApiError && error.isClientError()) {
        return false;
      }
      
      return failureCount < 2;
    },
    retryDelay: 1000,
    networkMode: 'online',
  },
};

/**
 * Pre-configured query client instance
 * Optimized for the Instagram clone application
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Helper function to invalidate queries by pattern
 */
export function invalidateQueries(pattern: string | string[]) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  
  patterns.forEach(p => {
    queryClient.invalidateQueries({ queryKey: [p] });
  });
}

/**
 * Helper function to remove queries by pattern
 */
export function removeQueries(pattern: string | string[]) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  
  patterns.forEach(p => {
    queryClient.removeQueries({ queryKey: [p] });
  });
}

export default queryClient;
