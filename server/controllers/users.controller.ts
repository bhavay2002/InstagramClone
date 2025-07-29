// src/controllers/user.controller.ts
import { Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";
import type { SessionRequest } from "../types/SessionRequest";
import { getUserId } from "../utils/getUserId";


/**
 * Search users based on query string.
 */
export const searchUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  const userId = getUserId(req);

  if (!q || typeof q !== "string") {
    res.status(400).json({ message: "Search query is required" });
    return;
  }

  const users = await storage.searchUsers(q, userId);
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
  const userId = getUserId(req);
  const updateData = req.body;
  const user = await storage.updateUser(userId, updateData);
  res.json(user);
});

/**
 * Get suggested users for the logged-in user.
 */
export const getSuggestedUsers = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const suggestions = await storage.getSuggestedUsers(userId);
  res.json(suggestions);
});

/**
 * Get saved posts for a given user (only if requesting user matches).
 */
export const getSavedPosts = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = getUserId(req);

  // Handle username or user ID
  let targetUserId = userId;
  if (userId && !userId.includes('-')) {
    const user = await storage.getUserByUsername(userId);
    if (user) {
      targetUserId = user.id;
    }
  }

  // Only allow users to view their own saved posts
  if (targetUserId !== currentUserId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  const savedPosts = await storage.getSavedPosts(targetUserId);
  
  // Enrich posts with user data and interaction status
  const enrichedPosts = await Promise.all(savedPosts.map(async (post: any) => {
    const postUser = await storage.getUser(post.userId);
    const hasLiked = await storage.hasLikedPost(currentUserId, post.id);
    const hasSaved = true; // Obviously saved since it's in the saved posts

    return {
      ...post,
      user: postUser,
      hasLiked,
      hasSaved,
    };
  }));

  res.json(enrichedPosts);
});
