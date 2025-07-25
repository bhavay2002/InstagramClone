import { Request, Response } from "express";
import { storage } from "../storage";
import asyncHandler from "express-async-handler";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.claims.sub;
  const notifications = await storage.getNotifications(userId);
  res.json(notifications);
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await storage.markNotificationAsRead(parseInt(id));
  res.json({ success: true });
});

export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.claims.sub;
  await storage.markAllNotificationsAsRead(userId);
  res.json({ success: true });
});