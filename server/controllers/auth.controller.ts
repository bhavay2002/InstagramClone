import { Request, Response, NextFunction, Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { passport } from "../auth/passport";
import { getSession } from "../auth/session";
import { storage } from "../storage";
import type { SessionRequest } from "../types/SessionRequest";

// Setup authentication middleware and routes
export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes - only if Google OAuth is configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
  } else {
    // Fallback route if Google OAuth is not configured
    app.get("/api/auth/google", (req: Request, res: Response) => {
      res.status(501).json({ message: "Google OAuth not configured" });
    });
    
    app.get("/api/auth/google/callback", (req: Request, res: Response) => {
      res.status(501).json({ message: "Google OAuth not configured" });
    });
  }

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

    // Create session
    req.session!.user = {
      id: user.id,
      email: user.email || null,
      password: null, // Never store password in session
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      username: user.username,
      profileImageUrl: user.profileImageUrl || null,
      bio: user.bio || null,
      isPrivate: user.isPrivate || false,
      followerCount: user.followerCount || 0,
      followingCount: user.followingCount || 0,
      postCount: user.postCount || 0,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    };

    // Return user data (without password)
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, message: "Login successful" });
  }));
}

// Register new user
export const register = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { firstName, lastName, username, email, password } = req.body;

  // Check if user already exists
  const existingUserByEmail = await storage.getUserByEmail(email);
  if (existingUserByEmail) {
    res.status(409).json({ message: "User with this email already exists" });
    return;
  }

  const existingUserByUsername = await storage.getUserByUsername(username);
  if (existingUserByUsername) {
    res.status(409).json({ message: "Username is already taken" });
    return;
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await storage.upsertUser({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Automatically log in the user after registration
  req.session!.user = {
    id: newUser.id,
    email: newUser.email || null,
    password: null, // Never store password in session
    firstName: newUser.firstName || null,
    lastName: newUser.lastName || null,
    username: newUser.username,
    profileImageUrl: newUser.profileImageUrl || null,
    bio: newUser.bio || null,
    isPrivate: newUser.isPrivate || false,
    followerCount: newUser.followerCount || 0,
    followingCount: newUser.followingCount || 0,
    postCount: newUser.postCount || 0,
    createdAt: newUser.createdAt || null,
    updatedAt: newUser.updatedAt || null,
  };

  // Return user data (without password)
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Login user (alias for custom-login for consistent API)
export const login = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
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

  // Create session
  req.session!.user = {
    id: user.id,
    email: user.email || null,
    password: null, // Never store password in session
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    username: user.username,
    profileImageUrl: user.profileImageUrl || null,
    bio: user.bio || null,
    isPrivate: user.isPrivate || false,
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    postCount: user.postCount || 0,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };

  // Return user data (without password)
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, message: "Login successful" });
});

// Logout user
export const logout = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Could not log out" });
        return;
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  } else {
    res.json({ message: "No active session" });
  }
});