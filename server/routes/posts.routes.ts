import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { validate } from "../middleware/validate";
import { insertPostSchema } from "@shared/schema";
import * as postsController from "../controllers/posts.controller";

const router = Router();

// Post routes - don't validate userId since it comes from session
router.post('/', isAuthenticated, postsController.createPost);
router.get('/feed', isAuthenticated, postsController.getFeedPosts);
router.get('/:id', isAuthenticated, postsController.getPost);
router.put('/:id', isAuthenticated, postsController.updatePost);
router.delete('/:id', isAuthenticated, postsController.deletePost);

// Like and save routes
router.post('/:id/like', isAuthenticated, postsController.likePost);
router.post('/:id/save', isAuthenticated, postsController.savePost);

export default router;