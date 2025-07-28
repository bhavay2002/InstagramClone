import { Request } from "express";
import type { SessionRequest } from "../types/SessionRequest";

export const getUserId = (req: Request): string => {
  // Try session-based auth first (our primary method)
  const sessionReq = req as SessionRequest;
  if (sessionReq.session?.user?.id) {
    return sessionReq.session.user.id;
  }
  
  // Try passport-based auth (for Google OAuth)
  if ('user' in req && (req.user as any)?.id) {
    return (req.user as any).id;
  }
  
  // Legacy Replit Auth format (fallback)
  if ('user' in req && (req.user as any)?.claims?.sub) {
    return (req.user as any).claims.sub;
  }
  
  throw new Error("User not authenticated");
};