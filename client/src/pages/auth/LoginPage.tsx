import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Instagram, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyErrorMessage } from "@/lib/authUtils";

/**
 * Login page component with enhanced error handling and accessibility
 * Features: Loading states, error handling, accessibility, and responsive design
 */
export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    setLocation('/feed');
    return null;
  }

  /**
   * Handle Google OAuth login with proper error handling
   */
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Track login attempt
      console.log('Initiating Google OAuth login');
      
      // Redirect to Google OAuth endpoint
      window.location.href = "/api/auth/google";
    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err, 'Failed to start login process');
      setError(errorMessage);
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }, [toast]);

  /**
   * Clear error state when user interacts
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header Section */}
        <header className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Instagram className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect with friends and share your moments
          </p>
        </header>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Use your account to access your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Login Button */}
            <Button 
              onClick={handleGoogleLogin}
              onFocus={clearError}
              disabled={isLoggingIn}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              aria-label="Continue with Google OAuth"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
            </Button>
            
            {/* Divider */}
            <div className="relative" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                  Or
                </span>
              </div>
            </div>

            {/* Email Login Link */}
            <Link to="/signin">
              <Button 
                variant="outline"
                className="w-full font-medium py-3"
                size="lg"
                disabled={isLoggingIn}
                aria-label="Sign in with email"
              >
                Sign In with Email
              </Button>
            </Link>
            
            {/* Terms Notice */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By continuing, you agree to our{' '}
              <button 
                className="underline hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={() => console.log('Terms of service clicked')}
              >
                terms of service
              </button>
              {' '}and{' '}
              <button 
                className="underline hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={() => console.log('Privacy policy clicked')}
              >
                privacy policy
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup">
              <span className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer">
                Sign up
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}