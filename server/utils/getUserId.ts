import { Request } from "express";

export const getUserId = (req: Request): string => {
  if ('session' in req && req.session?.user?.id) return req.session.user.id;
  if ('user' in req && (req.user as any)?.claims?.sub) return (req.user as any).claims.sub;
  throw new Error("User ID not found");
};