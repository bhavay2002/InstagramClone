import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { validate } from "../middleware/validate";
import { insertStorySchema } from "@shared/schema";
import * as storiesController from "../controllers/stories.controller";

const router = Router();

// Story routes
router.post('/', isAuthenticated, validate(insertStorySchema), storiesController.createStory);
router.get('/following', isAuthenticated, storiesController.getFollowingStories);
router.get('/:userId', isAuthenticated, storiesController.getActiveStories);
router.post('/:id/view', isAuthenticated, storiesController.viewStory);

export default router;