import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Base controller class with common functionality
export abstract class BaseController {
  // Protected method to validate request body against Zod schema
  protected validateBody<T>(schema: ZodSchema<T>, req: Request): T {
    try {
      return schema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Validation failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  // Protected method to validate query parameters
  protected validateQuery<T>(schema: ZodSchema<T>, req: Request): T {
    try {
      return schema.parse(req.query);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Query validation failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  // Protected method to get user ID from request
  protected getUserId(req: Request): string {
    // Check for Replit Auth user
    if (req.isAuthenticated && req.isAuthenticated() && (req.user as any)?.id) {
      return (req.user as any).id;
    }

    // Check for session-based auth
    const session = (req as any).session;
    if (session?.user?.id) {
      return session.user.id;
    }

    throw new Error("User not authenticated");
  }

  // Protected method to check if user is authenticated
  protected isAuthenticated(req: Request): boolean {
    try {
      this.getUserId(req);
      return true;
    } catch {
      return false;
    }
  }

  // Protected method to send success response
  protected sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message: message || 'Operation successful',
      data
    });
  }

  // Protected method to send error response
  protected sendError(res: Response, message: string, statusCode: number = 400, details?: any): void {
    res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details })
    });
  }

  // Async wrapper to handle errors in controller methods
  protected asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}