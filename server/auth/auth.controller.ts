import { Request, Response, NextFunction, Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { passport } from "./passport";
import { getSession } from "./session";
import { storage } from "../storage";
import type { SessionRequest } from "../types/SessionRequest";

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to feed
      res.redirect("/feed");
    }
  );

  // Get current user route
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      // Passport-based authentication (Google OAuth)
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (user) {
        const { password, ...safeUser } = user as any;
        return res.json(safeUser);
      }
    } else if ((req as SessionRequest).session?.user) {
      // Session-based authentication (email/password)
      let user = (req as SessionRequest).session.user;
      if (user) {
        const fullUser = await storage.getUser(user.id);
        if (fullUser) {
          user = fullUser as any;
        }
        const { password, ...safeUser } = user as any;
        return res.json(safeUser);
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  });

  // Local email/password login route
  app.post("/api/auth/custom-login", asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    req.session.regenerate(err => {
      if (err) {
        res.status(500).json({ message: "Session error" });
        return;
      }

      req.session.user = {
        id: user.id!,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName!,
        lastName: user.lastName!,
        profileImageUrl: user.profileImageUrl ?? null,
      };

      req.session.save(err => {
        if (err) {
          res.status(500).json({ message: "Session save error" });
          return;
        }

        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, message: "Login successful" });
      });
    });
  }));

  // Register route
  app.post("/api/auth/register", asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, username } = req.body;

    if (!email || !password || !firstName || !lastName || !username) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!email.includes("@")) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const [userByEmail, userByUsername] = await Promise.all([
      storage.getUserByEmail(email),
      storage.getUserByUsername(username),
    ]);

    if (userByEmail) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }

    if (userByUsername) {
      res.status(409).json({ message: "Username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await storage.upsertUser({
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      username,
      firstName,
      lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser });
  }));

  // Logout route (works for both authentication methods)
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      // Passport logout
      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie("connect.sid");
          res.json({ message: "Logged out" });
        });
      });
    } else {
      // Session logout
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    }
  });

  // Legacy route for backward compatibility
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
}
