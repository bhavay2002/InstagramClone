import { useState, useEffect, useCallback } from "react";

/**
 * Mobile breakpoint in pixels
 * Matches Tailwind CSS 'md' breakpoint for consistency
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook return type for mobile detection
 */
interface UseIsMobileReturn {
  /** Whether the current viewport is mobile-sized */
  isMobile: boolean;
  /** Whether the hook has initialized (prevents hydration mismatches) */
  isInitialized: boolean;
}

/**
 * Custom hook for detecting mobile viewport size
 * 
 * Features:
 * - SSR-safe implementation prevents hydration mismatches
 * - Uses ResizeObserver when available for better performance
 * - Debounced resize handling to prevent excessive re-renders
 * - Proper cleanup to prevent memory leaks
 * 
 * @param breakpoint - Custom breakpoint in pixels (default: 768)
 * @returns Object with mobile state and initialization status
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): UseIsMobileReturn {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Memoized function to check if viewport is mobile
  const checkIsMobile = useCallback((): boolean => {
    return window.innerWidth < breakpoint;
  }, [breakpoint]);

  // Debounced resize handler to prevent excessive re-renders
  const handleResize = useCallback(() => {
    setIsMobile(checkIsMobile());
  }, [checkIsMobile]);

  useEffect(() => {
    // Only run on client side to prevent SSR issues
    if (typeof window === 'undefined') return;

    // Initialize state
    setIsMobile(checkIsMobile());
    setIsInitialized(true);

    // Use ResizeObserver if available, otherwise fall back to resize event
    let cleanup: (() => void) | undefined;

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.documentElement);
      
      cleanup = () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fallback to window resize event with debouncing
      let timeoutId: NodeJS.Timeout;
      
      const debouncedResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, 150);
      };

      window.addEventListener('resize', debouncedResize, { passive: true });
      
      cleanup = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', debouncedResize);
      };
    }

    return cleanup;
  }, [checkIsMobile, handleResize]);

  return {
    isMobile,
    isInitialized,
  };
}

/**
 * Simplified hook that returns only the boolean mobile state
 * For backward compatibility with existing code
 * 
 * @param breakpoint - Custom breakpoint in pixels
 * @returns Boolean indicating if viewport is mobile-sized
 */
export function useIsMobileSimple(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const { isMobile } = useIsMobile(breakpoint);
  return isMobile;
}

// Export the simple version as default for backward compatibility
export default useIsMobileSimple;
