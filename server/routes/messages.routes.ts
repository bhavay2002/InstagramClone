import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { validate } from "../middleware/validate";
import { insertMessageSchema } from "@shared/schema";
import * as messagesController from "../controllers/messages.controller";

const router = Router();

// Message routes
router.post('/', isAuthenticated, validate(insertMessageSchema), messagesController.sendMessage);
router.get('/conversations', isAuthenticated, messagesController.getConversations);
router.get('/:userId', isAuthenticated, messagesController.getConversation);
router.put('/:userId/read', isAuthenticated, messagesController.markMessagesAsRead);
router.delete('/:id', isAuthenticated, messagesController.deleteMessage);

export default router;