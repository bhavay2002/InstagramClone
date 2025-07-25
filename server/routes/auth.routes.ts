import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { insertUserSchema } from "@shared/schema";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Auth routes
router.get('/user', isAuthenticated, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/custom-login', authLimiter, authController.login);
router.post('/register', validate(insertUserSchema), authController.register);

export default router;