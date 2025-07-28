import { Request, Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const followerId = getUserId(req);

  if (userId === followerId) {
    res.status(400).json({ message: "Cannot follow yourself" });
    return;
  }

  await storage.followUser(followerId, userId);

  await storage.createNotification({
    userId,
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

  await storage.unfollowUser(followerId, userId);
  res.json({ success: true });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const followers = await storage.getFollowers(userId);
  res.json(followers);
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const following = await storage.getFollowing(userId);
  res.json(following);
});

export const checkFollowStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId, targetUserId } = req.params;
  const isFollowing = await storage.isFollowing(userId, targetUserId);
  res.json({ isFollowing });
});
