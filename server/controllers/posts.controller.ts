import type { Response } from "express";
import type { SessionRequest } from "../types/SessionRequest";
import { storage } from "../storage";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";

export const createPost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = getUserId(req);
  
  // Create post data with userId from session, not from request body
  const postData = insertPostSchema.parse({ 
    userId,
    caption: req.body.caption,
    media: req.body.media,
    mediaType: req.body.mediaType,
    location: req.body.location || null
  });

  const post = await storage.createPost(postData);
  res.json(post);
});

export const getFeedPosts = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const userId = getUserId(req);
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

export const getPost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  const postId = parseInt(id);
  if (isNaN(postId)) {
    res.status(400).json({ message: "Invalid post ID" });
    return;
  }
  
  const post = await storage.getPost(postId);

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

export const getUserPosts = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const posts = await storage.getUserPosts(userId);
  res.json(posts);
});

export const updatePost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);

  const postId = parseInt(id);
  if (isNaN(postId)) {
    res.status(400).json({ message: "Invalid post ID" });
    return;
  }

  const post = await storage.getPost(postId);
  if (!post || post.userId !== userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  const updatedPost = await storage.updatePost(postId, req.body);
  res.json(updatedPost);
});

export const deletePost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);

  const postId = parseInt(id);
  if (isNaN(postId)) {
    res.status(400).json({ message: "Invalid post ID" });
    return;
  }

  const post = await storage.getPost(postId);
  if (!post || post.userId !== userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  await storage.deletePost(postId);
  res.json({ success: true });
});

export const likePost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);

  const postId = parseInt(id);
  if (isNaN(postId)) {
    res.status(400).json({ message: "Invalid post ID" });
    return;
  }

  const hasLiked = await storage.hasLikedPost(userId, postId);
  if (hasLiked) {
    await storage.unlikePost(userId, postId);
  } else {
    await storage.likePost(userId, postId);

    const post = await storage.getPost(postId);
    if (post && post.userId !== userId) {
      await storage.createNotification({
        userId: post.userId,
        fromUserId: userId,
        type: "like",
        content: null,
        postId: postId,
        commentId: null,
        isRead: false,
      });
    }
  }

  res.json({ liked: !hasLiked });
});

export const savePost = asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getUserId(req);

  const postId = parseInt(id);
  if (isNaN(postId)) {
    res.status(400).json({ message: "Invalid post ID" });
    return;
  }

  const hasSaved = await storage.hasSavedPost(userId, postId);
  if (hasSaved) {
    await storage.unsavePost(userId, postId);
  } else {
    await storage.savePost(userId, postId);
  }

  res.json({ saved: !hasSaved });
});
