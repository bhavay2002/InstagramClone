import { Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { storage } from "../storage";
import type { SessionRequest } from "../types/SessionRequest";

export const getCurrentUser = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  if (!req.session?.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  let user = req.session.user;
  const fullUser = await storage.getUser(user.id);
  if (fullUser) user = fullUser as any;

  const { password, ...safeUser } = user as any;
  res.json(safeUser);
});

export const logout = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({ message: "Could not log out" });
        return;
      } else {
        res.json({ message: "Logout successful" });
        return;
      }
    });
  } else {
    res.json({ message: "Logout successful" });
  }
});

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
});

export const register = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
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
});
