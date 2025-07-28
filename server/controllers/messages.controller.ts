import { Request, Response } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import asyncHandler from "express-async-handler";
import { getUserId } from "../utils/getUserId";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = getUserId(req);
  const messageData = insertMessageSchema.parse({ ...req.body, senderId });

  const message = await storage.sendMessage(messageData);
  res.json(message);
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const conversations = await storage.getConversations(userId);
  res.json(conversations);
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = getUserId(req);

  const messages = await storage.getConversation(currentUserId, userId);
  res.json(messages);
});

export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = getUserId(req);

  await storage.markMessagesAsRead(userId, currentUserId);
  res.json({ success: true });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await storage.deleteMessage(parseInt(id));
  res.json({ success: true });
});