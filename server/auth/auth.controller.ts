import { Request, Response, NextFunction, Express } from "express";
import { passport } from "./passport";
import { getSession } from "./session";

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Login route with custom error handling
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (
        err: any,
        user: Express.User | false,
        info: { message?: string } | undefined
      ) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || "Authentication failed" });

        req.logIn(user, (err: any) => {
          if (err) return next(err);
          return res.json({ message: "Logged in successfully", user });
        });
      }
    )(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
}
