import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import * as usersController from "../controllers/users.controller";

const router = Router();

// User routes
router.get('/search', isAuthenticated, usersController.searchUsers);
router.put('/profile', isAuthenticated, usersController.updateProfile);
router.get('/:userId/suggestions', isAuthenticated, usersController.getSuggestedUsers);
router.get('/:userId/saved', isAuthenticated, usersController.getSavedPosts);
router.get('/:username', isAuthenticated, usersController.getUserByUsername); // Keep this last to avoid conflicts

export default router;