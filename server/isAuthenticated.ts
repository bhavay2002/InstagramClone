// middlewares/isAuthenticated.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Middleware to ensure the user is authenticated before proceeding.
* Supports both Replit Auth and custom session authentication.
 * Responds with 401 Unauthorized if not logged in.
 */
export const isAuthenticated: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for Replit Auth authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check for custom session authentication
  const session = (req as any).session;
  if (session && session.user) {
    // Add user info to request for compatibility with Replit Auth format
    (req as any).user = {
      claims: {
        sub: session.user.id,
        email: session.user.email,
        first_name: session.user.firstName,
        last_name: session.user.lastName,
        profile_image_url: session.user.profileImageUrl,
      }
    };
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};

