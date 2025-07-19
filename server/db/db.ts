import dotenv from "dotenv";
dotenv.config();

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon (required in serverless)
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is set
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("[DB] DATABASE_URL must be set in environment variables.");
}

// Initialize Neon Pool
const pool = new Pool({ connectionString });

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
