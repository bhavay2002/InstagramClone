import { Request, Response } from "express";
import { storage } from "../storage";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";

export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.claims.sub;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const storyData = insertStorySchema.parse({
    ...req.body,
    userId,
    expiresAt
  });

  const story = await storage.createStory(storyData);
  res.json(story);
});

export const getFollowingStories = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.claims.sub;
  const stories = await storage.getFollowingStories(userId);
  res.json(stories);
});

export const getActiveStories = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const stories = await storage.getActiveStories(userId);
  res.json(stories);
});

export const viewStory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const viewerId = (req as any).user.claims.sub;

  await storage.viewStory(parseInt(id), viewerId);
  res.json({ success: true });
});