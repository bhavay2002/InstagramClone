import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Response } from "express";
import { SessionRequest } from "../types/SessionRequest";
import { storage } from "../storage";
import { createSessionUser } from "../utils/createSessionUser";
import { sanitizeUser } from "../utils/sanitizeUser";

// Register
export const register = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { firstName, lastName, username, email, password } = req.body;

  const [existingEmail, existingUsername] = await Promise.all([
    storage.getUserByEmail(email),
    storage.getUserByUsername(username),
  ]);

  if (existingEmail) {
    res.status(409).json({ message: "User with this email already exists" });
    return;
  }

  if (existingUsername) {
    res.status(409).json({ message: "Username is already taken" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
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

  req.session!.user = createSessionUser(newUser);
  res.status(201).json(sanitizeUser(newUser));
});

// Login
export const login = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await storage.getUserByEmail(email);
  if (!user || !user.password) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  req.session!.user = createSessionUser(user);
  res.json({ user: sanitizeUser(user), message: "Login successful" });
});

// Logout
export const logout = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Could not log out" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } else {
    res.json({ message: "No active session" });
  }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const user =
    req.isAuthenticated() && req.user
      ? await storage.getUser((req.user as any).id)
      : req.session?.user
      ? await storage.getUser(req.session.user.id)
      : null;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  res.json(sanitizeUser(user));
});
