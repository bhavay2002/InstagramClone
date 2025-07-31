import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

/**
 * Authentication hook return type
 */
interface UseAuthReturn {
  /** Current authenticated user or null */
  user: User | null;
  /** Whether authentication is being loaded */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Authentication error */
  error: Error | null;
  /** Manually refetch authentication status */
  refetch: () => Promise<void>;
  /** Clear authentication cache */
  clearAuth: () => void;
}

/**
 * Custom hook for managing authentication state
 * 
 * Features:
 * - Automatic retry logic that respects 401 errors
 * - Optimized caching strategy for auth data
 * - Manual refetch capability
 * - Type-safe user data handling
 * 
 * @returns Authentication state and utility functions
 */
export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  
  const authQuery = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors - these are expected
      if (isUnauthorizedError(error) || error?.message?.includes('401')) {
        return false;
      }
      
      // Limit retries for other errors to prevent excessive requests
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Check auth when user returns to tab
    refetchOnMount: true, // Always check auth on component mount
    refetchOnReconnect: true, // Check auth when network reconnects
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    networkMode: 'online', // Only run when online
  });

  // Manual refetch function with error handling
  const refetch = useCallback(async (): Promise<void> => {
    try {
      await authQuery.refetch();
    } catch (error) {
      console.warn('Failed to refetch authentication status:', error);
      // Don't throw - let the query handle the error state
    }
  }, [authQuery]);

  // Clear authentication cache
  const clearAuth = useCallback((): void => {
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [queryClient]);

  // Memoize computed values for performance
  const computedValues = useMemo(() => ({
    user: (authQuery.data as User) || null,
    isAuthenticated: Boolean(authQuery.data),
    error: authQuery.error,
  }), [authQuery.data, authQuery.error]);

  return {
    ...computedValues,
    isLoading: authQuery.isLoading,
    refetch,
    clearAuth,
  };
}
