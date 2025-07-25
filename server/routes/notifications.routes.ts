import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import * as notificationsController from "../controllers/notifications.controller";

const router = Router();

// Notification routes
router.get('/', isAuthenticated, notificationsController.getNotifications);
router.put('/:id/read', isAuthenticated, notificationsController.markNotificationAsRead);
router.put('/read-all', isAuthenticated, notificationsController.markAllNotificationsAsRead);

export default router;