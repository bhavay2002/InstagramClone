import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Ensure DATABASE_URL is set
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("[DB] DATABASE_URL must be set in environment variables.");
}

// Initialize PostgreSQL Pool for Neon environment
const pool = new Pool({ 
  connectionString,
  ssl: true
});

// Initialize Drizzle with schema
const db = drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  console.log("[DB] Drizzle connected to Neon Postgres");
}

process.on("SIGINT", async () => {
  console.log("[DB] Closing DB connection...");
  await pool.end();
  process.exit(0);
});

export { db, pool };
