import cors from 'cors';
import type { CorsOptions } from 'cors';

// CORS configuration based on environment
const getCorsOptions = (): CorsOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production CORS settings - restrictive
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://*.replit.app',
      'https://*.replit.dev',
      'https://*.replit.com',
    ].filter(Boolean);

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (!allowedOrigin) return false;
          if (allowedOrigin.includes('*')) {
            const pattern = allowedOrigin.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(origin);
          }
          return allowedOrigin === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cookie',
      ],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours
    };
  } else {
    // Development CORS settings - permissive
    return {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: '*',
      exposedHeaders: ['Set-Cookie'],
    };
  }
};

export const corsMiddleware = cors(getCorsOptions());