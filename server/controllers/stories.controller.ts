import { Request, Response } from "express";
import { storage } from "../storage";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";

export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const storyData = {
    userId,
    mediaUrl: req.body.mediaUrl,
    mediaType: req.body.mediaType,
    expiresAt
  };

  const story = await storage.createStory(storyData);
  res.json(story);
});

export const getFollowingStories = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
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
  const viewerId = getUserId(req);

  await storage.viewStory(parseInt(id), viewerId);
  res.json({ success: true });
});