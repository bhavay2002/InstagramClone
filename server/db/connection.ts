import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "@shared/schema";

// Database configuration interface
interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

// Get database configuration from environment
const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Use DATABASE_URL if available (production/deployment)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "5000"),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    };
  }

  // Check for Replit environment variables
  if (process.env.PGHOST && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      ssl: false,
      maxConnections: 10,
      connectionTimeout: 5000,
      idleTimeout: 30000,
    };
  }

  // Development fallback configuration
  return {
    host: 'localhost',
    port: 5432,
    database: 'instagram_dev',
    user: 'postgres',
    password: 'password',
    ssl: false,
    maxConnections: 10,
    connectionTimeout: 5000,
    idleTimeout: 30000,
  };
};

// Create database connection pool
export const createDatabaseConnection = () => {
  const config = getDatabaseConfig();
  
  const poolConfig: PoolConfig = {
    connectionTimeoutMillis: config.connectionTimeout,
    idleTimeoutMillis: config.idleTimeout,
    max: config.maxConnections,
    ssl: config.ssl,
  };

  // Add connection string or individual parameters
  if (config.connectionString) {
    poolConfig.connectionString = config.connectionString;
    console.log("[DB] Connecting with connection string:", config.connectionString.replace(/:[^:]*@/, ":***@"));
  } else {
    poolConfig.host = config.host;
    poolConfig.port = config.port;
    poolConfig.database = config.database;
    poolConfig.user = config.user;
    poolConfig.password = config.password;
    console.log(`[DB] Connecting to: ${config.host}:${config.port}/${config.database}`);
  }

  const pool = new Pool(poolConfig);

  // Connection event handlers
  pool.on('connect', (client) => {
    console.log("[DB] New client connected to PostgreSQL");
  });

  pool.on('error', (err, client) => {
    console.error("[DB] Unexpected error on idle client:", err);
  });

  pool.on('acquire', (client) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[DB] Client acquired from pool");
    }
  });

  pool.on('release', (err, client) => {
    if (err) {
      console.error("[DB] Error releasing client:", err);
    } else if (process.env.NODE_ENV === 'development') {
      console.log("[DB] Client released back to pool");
    }
  });

  // Test connection on startup
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error("[DB] Failed to connect to PostgreSQL:", err.message);
    } else {
      console.log("[DB] Successfully connected to PostgreSQL");
    }
  });

  // Graceful shutdown handler
  const gracefulShutdown = async () => {
    console.log("[DB] Closing database connection pool...");
    try {
      await pool.end();
      console.log("[DB] Database connection pool closed successfully");
    } catch (error) {
      console.error("[DB] Error closing database connection pool:", error);
    }
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGQUIT", gracefulShutdown);

  return pool;
};

// Create and export database instance
export const pool = createDatabaseConnection();
export const db = drizzle(pool, { schema });

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT 1 as health');
    return result.rows.length > 0;
  } catch (error) {
    console.error("[DB] Health check failed:", error);
    return false;
  }
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    const stats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingConnections: pool.waitingCount,
    };
    return stats;
  } catch (error) {
    console.error("[DB] Failed to get database stats:", error);
    return null;
  }
};