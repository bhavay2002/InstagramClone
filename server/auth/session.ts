import session from "express-session";
import connectPg from "connect-pg-simple";
import { RequestHandler } from "express";

// Fail fast in production if no SESSION_SECRET
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be defined in production");
}

export function getSession(): RequestHandler {
  const pgStore = connectPg(session);

  return session({
    store: new pgStore({
      conString: process.env.DATABASE_URL!,
      createTableIfMissing: false,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "instagram_clone_dev_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}
