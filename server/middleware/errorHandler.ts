import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

// Development error response (includes stack trace)
const sendErrorDev = (err: any, req: Request, res: Response) => {
  console.error('[ERROR]', {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    user: (req as any).user?.id || 'anonymous'
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
    },
  });
};

// Production error response (no stack trace)
const sendErrorProd = (err: any, req: Request, res: Response) => {
  // Log error for monitoring
  console.error('[ERROR]', {
    message: err.message,
    statusCode: err.statusCode || 500,
    url: req.url,
    method: req.method,
    user: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  // Only send operational errors to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  } else {
    // Don't leak error details in production
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Handle Zod validation errors
const handleZodError = (err: ZodError): ValidationError => {
  const message = err.errors
    .map(error => `${error.path.join('.')}: ${error.message}`)
    .join(', ');
  
  return new ValidationError(`Validation failed: ${message}`);
};

// Handle database constraint errors
const handleDatabaseError = (err: any): AppError => {
  if (err.code === '23505') { // Unique constraint violation
    return new ValidationError('A record with this information already exists');
  }
  
  if (err.code === '23503') { // Foreign key constraint violation
    return new ValidationError('Referenced record does not exist');
  }
  
  if (err.code === '23502') { // Not null constraint violation
    return new ValidationError('Required field is missing');
  }

  return new AppError('Database operation failed', 500, false);
};

// Main error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    error = handleDatabaseError(err);
  } else if (err.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  } else if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
     
