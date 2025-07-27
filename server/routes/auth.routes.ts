import { Router } from "express";
import { validate } from "../middleware/validate";
import { insertUserSchema } from "@shared/schema";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Registration route
router.post("/register", validate(insertUserSchema.omit({ id: true })), authController.register);

// Logout route
router.post("/logout", authController.logout);

export default router;