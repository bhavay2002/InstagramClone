import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth as setupCustomAuth } from "../controllers/auth.controller";
import { initWebSocketServer } from "../socket";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/isAuthenticated";
import * as postsController from "../controllers/posts.controller";

// Import route modules
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import followsRoutes from "./follows.routes";
import postsRoutes from "./posts.routes";
import commentsRoutes from "./comments.routes";
import messagesRoutes from "./messages.routes";
import storiesRoutes from "./stories.routes";
import notificationsRoutes from "./notifications.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupCustomAuth(app);

  // Development: Seed database endpoint
  if (process.env.NODE_ENV === "development") {
    app.post("/api/dev/seed-database", async (req, res) => {
      try {
        const { seedDatabase } = await import("../data/seedData");
        const result = await seedDatabase();
        res.json({ 
          message: "Database seeded successfully!", 
          ...result 
        });
      } catch (error) {
        console.error("Seeding error:", error);
        res.status(500).json({ 
          message: "Failed to seed database", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });
  }

  // Register route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/users', followsRoutes); // Follow routes are under /api/users/:userId/follow
  app.use('/api/posts', postsRoutes);
  app.use('/api', commentsRoutes); // Comments routes include /api/posts/:id/comments
  app.use('/api/messages', messagesRoutes);
  app.use('/api/stories', storiesRoutes);
  app.use('/api/notifications', notificationsRoutes);
  
  // Additional route for user posts (mounted under /api/users/:userId/posts)
  app.get('/api/users/:userId/posts', isAuthenticated, postsController.getUserPosts);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server with decoupled implementation
  const { wss, connectedUsers } = initWebSocketServer(httpServer);

  // Clean up expired stories periodically
  setInterval(async () => {
    try {
      await storage.deleteExpiredStories();
    } catch (error) {
      console.error('Error cleaning up expired stories:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  return httpServer;
}