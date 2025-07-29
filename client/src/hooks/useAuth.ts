import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors - this is expected when not authenticated
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    staleTime: 0, // Always consider data stale to check auth status
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
