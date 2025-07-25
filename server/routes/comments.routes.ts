import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { validate } from "../middleware/validate";
import { insertCommentSchema } from "@shared/schema";
import * as commentsController from "../controllers/comments.controller";

const router = Router();

// Comment routes (these will be mounted under /api so paths become /api/posts/:id/comments)
router.post('/posts/:id/comments', isAuthenticated, validate(insertCommentSchema), commentsController.createComment);
router.get('/posts/:id/comments', isAuthenticated, commentsController.getPostComments);
router.put('/:id', isAuthenticated, commentsController.updateComment);
router.delete('/:id', isAuthenticated, commentsController.deleteComment);
router.post('/:id/like', isAuthenticated, commentsController.likeComment);

export default router;