import "express-session";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
