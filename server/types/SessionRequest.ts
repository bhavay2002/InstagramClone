// types/session-request.ts
import type { Request } from "express";
import type { Session } from "express-session";
import type { User } from "@shared/schema";


export interface SessionRequest extends Request {
  session: Session & {
    user?: User;
  };
}

export type AuthenticatedRequest = SessionRequest & {
  session: Session & {
    user: User; // Non-optional here
  };
};
