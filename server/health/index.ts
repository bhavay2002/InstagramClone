import { Request, Response } from 'express';
import { checkDatabaseHealth, getDatabaseStats } from '../db/connection';

// Basic health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    const dbStats = await getDatabaseStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        connected: dbHealthy,
        stats: dbStats
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Readiness check for deployment platforms
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'Database not available'
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};