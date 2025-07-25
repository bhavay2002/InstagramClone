import type { Response } from "express";
import type { SessionRequest } from "../types/SessionRequest";
import { storage } from "../storage";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";

export const createPost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const userId = req.user?.claims.sub!;
  const postData = insertPostSchema.parse({ ...req.body, userId });

  const post = await storage.createPost(postData);
  res.json(post);
});

export const getFeedPosts = asyncHandler(async (req: SessionRequest, res: Response) => {
  const userId = req.user?.claims.sub!;
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;

  const posts = await storage.getFeedPosts(userId, offset, limit);
  const enrichedPosts = await Promise.all(posts.map(async (post: any) => {
    const postUser = await storage.getUser(post.userId);
    const hasLiked = await storage.hasLikedPost(userId, post.id);
    const hasSaved = await storage.hasSavedPost(userId, post.id);

    return {
      ...post,
      user: postUser,
      hasLiked,
      hasSaved,
    };
  }));

  res.json(enrichedPosts);
});

export const getPost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.claims.sub!;
  const post = await storage.getPost(parseInt(id));

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const postUser = await storage.getUser(post.userId);
  const hasLiked = await storage.hasLikedPost(userId, post.id);
  const hasSaved = await storage.hasSavedPost(userId, post.id);

  res.json({
    ...post,
    user: postUser,
    hasLiked,
    hasSaved,
  });
});

export const getUserPosts = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { userId } = req.params;
  const posts = await storage.getUserPosts(userId);
  res.json(posts);
});

export const updatePost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.claims.sub!;

  const post = await storage.getPost(parseInt(id));
  if (!post || post.userId !== userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  const updatedPost = await storage.updatePost(parseInt(id), req.body);
  res.json(updatedPost);
});

export const deletePost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.claims.sub!;

  const post = await storage.getPost(parseInt(id));
  if (!post || post.userId !== userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  await storage.deletePost(parseInt(id));
  res.json({ success: true });
});

export const likePost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.claims.sub!;

  const hasLiked = await storage.hasLikedPost(userId, parseInt(id));
  if (hasLiked) {
    await storage.unlikePost(userId, parseInt(id));
  } else {
    await storage.likePost(userId, parseInt(id));

    const post = await storage.getPost(parseInt(id));
    if (post && post.userId !== userId) {
      await storage.createNotification({
        userId: post.userId,
        fromUserId: userId,
        type: "like",
        content: null,
        postId: parseInt(id),
        commentId: null,
        isRead: false,
      });
    }
  }

  res.json({ liked: !hasLiked });
});

export const savePost = asyncHandler(async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.claims.sub!;

  const hasSaved = await storage.hasSavedPost(userId, parseInt(id));
  if (hasSaved) {
    await storage.unsavePost(userId, parseInt(id));
  } else {
    await storage.savePost(userId, parseInt(id));
  }

  res.json({ saved: !hasSaved });
});
