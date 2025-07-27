// src/controllers/user.controller.ts
import { Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";
import type { SessionRequest } from "../types/SessionRequest";


/**
 * Search users based on query string.
 */
export const searchUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  const userId = req.session.user?.id;

  if (!q || typeof q !== "string") {
    res.status(400).json({ message: "Search query is required" });
    return;
  }

  const users = await storage.searchUsers(q, userId || "");
  res.json(users);
});

/**
 * Get user details by username.
 */
export const getUserByUsername = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const user = await storage.getUserByUsername(username);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

/**
 * Update the logged-in user's profile.
 */
export const updateProfile = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = req.session.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const updateData = req.body;
  const user = await storage.updateUser(userId, updateData);
  res.json(user);
});

/**
 * Get suggested users for the logged-in user.
 */
export const getSuggestedUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = req.session.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const suggestions = await storage.getSuggestedUsers(userId);
  res.json(suggestions);
});

/**
 * Get saved posts for a given user (only if requesting user matches).
 */
export const getSavedPosts = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.session.user?.id;

  if (!currentUserId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (userId !== currentUserId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  const savedPosts = await storage.getSavedPosts(userId);
  res.json(savedPosts);
});
