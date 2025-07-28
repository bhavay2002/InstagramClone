import { Request, Response } from "express";
import { storage } from "../storage";
import { insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  console.log("Comment creation - postId:", id, "userId:", userId, "content:", req.body.content);
  
  // Validate content is provided
  if (!req.body.content || typeof req.body.content !== 'string' || req.body.content.trim() === '') {
    return res.status(400).json({ message: "Comment content is required" });
  }
  
  // Create comment data manually to avoid schema issues
  const commentData = {
    postId: parseInt(id),
    userId,
    content: req.body.content.trim(),
    parentId: req.body.parentId || null
  };
  
  console.log("Comment data to insert:", commentData);

  const comment = await storage.createComment(commentData);

  // Create notification
  const post = await storage.getPost(parseInt(id));
  if (post && post.userId !== userId) {
    await storage.createNotification({
      userId: post.userId,
      fromUserId: userId,
      type: 'comment',
      postId: parseInt(id),
      commentId: comment.id,
      content: comment.content,
      isRead: false,
    });
  }

  const commentUser = await storage.getUser(comment.userId);
  res.json({ ...comment, user: commentUser });
});

export const getPostComments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = await storage.getPostComments(parseInt(id));

  const enrichedComments = await Promise.all(comments.map(async (comment) => {
    const user = await storage.getUser(comment.userId);
    return { ...comment, user };
  }));

  res.json(enrichedComments);
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = getUserId(req);

  const comment = await storage.updateComment(parseInt(id), content);
  res.json(comment);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await storage.deleteComment(parseInt(id));
  res.json({ success: true });
});

export const likeComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = getUserId(req);

  const hasLiked = await storage.hasLikedComment(userId, parseInt(id));
  if (hasLiked) {
    await storage.unlikeComment(userId, parseInt(id));
  } else {
    await storage.likeComment(userId, parseInt(id));
  }

  res.json({ liked: !hasLiked });
});