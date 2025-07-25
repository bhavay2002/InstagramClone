// types/express-session.d.ts
import 'express-session';
import type { User } from './user';


declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
