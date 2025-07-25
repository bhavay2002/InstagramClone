import { Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";
import { SessionRequest } from "../types/SessionRequest";

export const searchUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  const userId = req.user?.claims.sub;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ message: "Search query is required" });
    return;
  }

  const users = await storage.searchUsers(q, userId);
  res.json(users);
});

export const getUserByUsername = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const user = await storage.getUserByUsername(username);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

export const updateProfile = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = req.user?.claims.sub!;
  const updateData = req.body;

  const user = await storage.updateUser(userId, updateData);
  res.json(user);
});

export const getSuggestedUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = req.user?.claims.sub!;
  const suggestions = await storage.getSuggestedUsers(userId);
  res.json(suggestions);
});

export const getSavedPosts = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.user?.claims.sub!;

  if (userId !== currentUserId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  const savedPosts = await storage.getSavedPosts(userId);
  res.json(savedPosts);
});
