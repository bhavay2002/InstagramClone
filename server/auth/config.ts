import type { AuthConfig } from './types';

// Authentication configuration with validation
export const getAuthConfig = (): AuthConfig => {
  const config: AuthConfig = {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000'), // 24 hours default
  };

  // Validate configuration
  if (process.env.NODE_ENV === 'production') {
    if (!config.googleClientId || !config.googleClientSecret) {
      console.warn('[AUTH] Google OAuth not configured for production');
    }
    if (config.sessionSecret === 'fallback-secret-for-dev') {
      throw new Error('[AUTH] SESSION_SECRET must be set in production');
    }
  }

  return config;
};

export const isGoogleOAuthConfigured = (): boolean => {
  const config = getAuthConfig();
  return !!(config.googleClientId && config.googleClientSecret);
};