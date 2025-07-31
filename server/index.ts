import express, { type Application } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { apiLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { corsMiddleware } from "./middleware/cors";
import { globalRateLimit, securityHeaders } from "./middleware/security";
import { authLimiter } from "./middleware/rateLimiter";

/**
 * Enhanced Express application setup with comprehensive middleware stack
 * Features: Security, CORS, rate limiting, error handling, and development tools
 */

// Environment configuration with defaults
const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Trust proxy for proper IP address handling in production
  app.set("trust proxy", 1);
  
  // Security middleware (must be first)
  app.use(securityHeaders);
  
  // CORS configuration
  app.use(corsMiddleware);
  
  // Rate limiting (disabled in development to prevent blocking)
  if (NODE_ENV === "production") {
    app.use('/api', globalRateLimit);
  }

  // Body parsing middleware with size limits
  app.use(express.json({ 
    limit: "10mb",
    strict: true,
    type: ["application/json", "text/plain"]
  }));
  
  app.use(express.urlencoded({ 
    extended: false, 
    limit: "10mb",
    parameterLimit: 100
  }));

  // Request logging
  app.use(apiLogger);

  return app;
}

/**
 * Initialize and start the server
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const httpServer = createServer(app);

    // Register API routes and authentication
    await registerRoutes(app);

    // Configure development or production static serving
    if (NODE_ENV === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, httpServer);
    } else {
      log("Setting up production static file serving...");
      serveStatic(app);
    }

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime(),
      });
    });

    // Start server with proper error handling
    await new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(PORT, HOST, () => {
        log(`Server started successfully`);
        log(`Environment: ${NODE_ENV}`);
        log(`Port: ${PORT}`);
        log(`Host: ${HOST}`);
        log(`Process ID: ${process.pid}`);
        resolve();
      });

      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          log(`Port ${PORT} is already in use`, "express", "error");
        } else if (error.code === "EACCES") {
          log(`Permission denied to bind to port ${PORT}`, "express", "error");
        } else {
          log(`Server error: ${error.message}`, "express", "error");
        }
        reject(error);
      });

      // Graceful shutdown handling
      const gracefulShutdown = (signal: string) => {
        log(`Received ${signal}, shutting down gracefully...`);
        server.close((err) => {
          if (err) {
            log(`Error during shutdown: ${err.message}`, "express", "error");
            process.exit(1);
          }
          log("Server closed successfully");
          process.exit(0);
        });
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    });

  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : "Unknown error"}`, "express", "error");
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  log(`Uncaught Exception: ${error.message}`, "express", "error");
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "express", "error");
  console.error(reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  log(`Startup failed: ${error.message}`, "express", "error");
  process.exit(1);
});
