import type { Request } from "express";
import type { Session, SessionData } from "express-session";

export interface User {
  id: string;
  email: string;
  password?: string;
}

export interface SessionRequest extends Request {
  session: Session & Partial<SessionData>;
  user?: { claims: { sub: string } };
}
