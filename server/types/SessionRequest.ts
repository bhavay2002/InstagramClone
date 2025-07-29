import type { Request } from "express";
import type { Session } from "express-session";
import type { SessionUser } from "./express-session"; 

export interface SessionRequest extends Request {
  session: Session & {
    user?: SessionUser;
  };
}

export type AuthenticatedRequest = SessionRequest & {
  session: Session & {
    user: SessionUser; // Non-optional here
  };
};
