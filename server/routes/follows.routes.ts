import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import * as followsController from "../controllers/follows.controller";

const router = Router();

// Follow routes (these will be mounted under /api/users so paths become /api/users/:userId/follow)
router.post('/:userId/follow', isAuthenticated, followsController.followUser);
router.delete('/:userId/follow', isAuthenticated, followsController.unfollowUser);
router.get('/:userId/followers', isAuthenticated, followsController.getFollowers);
router.get('/:userId/following', isAuthenticated, followsController.getFollowing);
router.get('/:userId/following/:targetUserId', isAuthenticated, followsController.checkFollowStatus);
router.get('/:username/following-status', isAuthenticated, followsController.checkCurrentUserFollowStatus);

export default router;