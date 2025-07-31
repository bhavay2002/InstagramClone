import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@shared/schema';

/**
 * Authentication context type definition
 * Provides user state, loading state, and authentication status
 */
interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** Whether authentication state is currently being loaded */
  isLoading: boolean;
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Authentication error if any */
  error: Error | null;
}

/**
 * Authentication context for providing auth state throughout the app
 * Should be used at the root level to wrap the entire application
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Manages authentication state and provides it to child components
 * 
 * @param children - Child components to wrap with auth context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const authHook = useAuth();
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user: authHook.user as User | null,
    isLoading: authHook.isLoading,
    isAuthenticated: authHook.isAuthenticated,
    error: authHook.error || null,
  }), [authHook.user, authHook.isLoading, authHook.isAuthenticated, authHook.error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider component
 * 
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context with user state and methods
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuthContext must be used within an AuthProvider. ' +
      'Make sure your component is wrapped in <AuthProvider>.'
    );
  }
  
  return context;
}

/**
 * Type guard to check if user is authenticated
 * Useful for TypeScript type narrowing
 * 
 * @param context - Auth context to check
 * @returns True if user is authenticated with valid user object
 */
export function isUserAuthenticated(
  context: AuthContextType
): context is AuthContextType & { user: User; isAuthenticated: true } {
  return context.isAuthenticated && context.user !== null;
}

export default AuthContext;
