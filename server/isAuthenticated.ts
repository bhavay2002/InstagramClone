// middlewares/isAuthenticated.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Middleware to ensure the user is authenticated before proceeding.
 * Responds with 401 Unauthorized if not logged in.
 */
export const isAuthenticated: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};
