// types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string | null;
      username: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  }
}
