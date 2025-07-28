import { Request, Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";
import type { SessionRequest } from "../types/SessionRequest";

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const followerId = getUserId(req);

  // Handle username or user ID
  let targetUserId = userId;
  if (userId && !userId.includes('-')) {
    const user = await storage.getUserByUsername(userId);
    if (user) {
      targetUserId = user.id;
    }
  }

  if (targetUserId === followerId) {
    res.status(400).json({ message: "Cannot follow yourself" });
    return;
  }

  await storage.followUser(followerId, targetUserId);

  await storage.createNotification({
    userId: targetUserId,
    fromUserId: followerId,
    type: 'follow',
    content: null,
    postId: null,
    commentId: null,
    isRead: false,
  });

  res.json({ success: true });
});

export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const followerId = getUserId(req);

  // Handle username or user ID
  let targetUserId = userId;
  if (userId && !userId.includes('-')) {
    const user = await storage.getUserByUsername(userId);
    if (user) {
      targetUserId = user.id;
    }
  }

  await storage.unfollowUser(followerId, targetUserId);
  res.json({ success: true });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Handle username or user ID
  let targetUserId = userId;
  if (userId && !userId.includes('-')) {
    const user = await storage.getUserByUsername(userId);
    if (user) {
      targetUserId = user.id;
    }
  }
  
  const followers = await storage.getFollowers(targetUserId);
  res.json(followers);
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Handle username or user ID
  let targetUserId = userId;
  if (userId && !userId.includes('-')) {
    const user = await storage.getUserByUsername(userId);
    if (user) {
      targetUserId = user.id;
    }
  }
  
  const following = await storage.getFollowing(targetUserId);
  res.json(following);
});

export const checkFollowStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId, targetUserId } = req.params;
  const isFollowing = await storage.isFollowing(userId, targetUserId);
  res.json({ isFollowing });
});

export const checkCurrentUserFollowStatus = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;
  const currentUserId = getUserId(req);
  
  // Get the target user by username
  const targetUser = await storage.getUserByUsername(username);
  if (!targetUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  
  const isFollowing = await storage.isFollowing(currentUserId, targetUser.id);
  res.json(isFollowing);
});
