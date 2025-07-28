import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create default database connection for development - using memory storage for now
const defaultConnectionString = "postgresql://postgres:password@localhost:5432/instagram_dev";

// Get DATABASE_URL from environment or use default for development
const connectionString = process.env.DATABASE_URL || defaultConnectionString;

console.log("[DB] Attempting to connect to:", connectionString.replace(/:[^:]*@/, ":***@"));

// Initialize PostgreSQL Pool with fallback configuration
const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  // Connection timeout and retry configuration
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  // Graceful fallback for development
  ...(process.env.NODE_ENV === "development" && {
    host: 'localhost',
    port: 5432,
    database: 'instagram_dev',
    user: 'postgres',
    password: 'password'
  })
});

// Initialize Drizzle with schema
const db = drizzle(pool, { schema });

// Test the connection
pool.on('connect', () => {
  console.log("[DB] Connected to PostgreSQL database");
});

pool.on('error', (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
});

if (process.env.NODE_ENV !== "production") {
  console.log("[DB] Drizzle connected to PostgreSQL");
}

process.on("SIGINT", async () => {
  console.log("[DB] Closing DB connection...");
  await pool.end();
  process.exit(0);
});

export { db, pool };
