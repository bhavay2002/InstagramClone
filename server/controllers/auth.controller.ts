import { Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { storage } from "../storage";
import type { SessionRequest } from "../types/SessionRequest";

export const getCurrentUser = asyncHandler(async (req: SessionRequest, res: Response) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let user = req.session.user;
  const fullUser = await storage.getUser(user.id);
  if (fullUser) user = fullUser;

  const { password, ...safeUser } = user as any;
  res.json(safeUser);
});

export const logout = asyncHandler(async (req: SessionRequest, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      } else {
        return res.json({ message: "Logout successful" });
      }
    });
  } else {
    return res.json({ message: "Logout successful" });
  }
});

export const login = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await storage.getUserByEmail(email);
  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  req.session.regenerate(err => {
    if (err) {
      return res.status(500).json({ message: "Session error" });
    }

    req.session.user = {
      id: user.id!,
      email: user.email!,
      username: user.username!,
      firstName: user.firstName!,
      lastName: user.lastName!,
      profileImageUrl: user.profileImageUrl ?? undefined,
    };

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ message: "Session save error" });
      }

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, message: "Login successful" });
    });
  });
});

export const register = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { email, password, firstName, lastName, username } = req.body;

  if (!email || !password || !firstName || !lastName || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const [userByEmail, userByUsername] = await Promise.all([
    storage.getUserByEmail(email),
    storage.getUserByUsername(username),
  ]);

  if (userByEmail) {
    return res.status(409).json({ message: "Email already exists" });
  }

  if (userByUsername) {
    return res.status(409).json({ message: "Username already exists" });
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
