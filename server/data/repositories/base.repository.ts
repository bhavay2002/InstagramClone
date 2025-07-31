import { db } from "../../db/db";
import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Base repository class with common CRUD operations
export abstract class BaseRepository<T> {
  protected db = db;

  // Abstract method to get table reference
  protected abstract getTable(): any;

  // Generic method to execute queries with error handling
  protected async executeQuery<R>(query: () => Promise<R>): Promise<R> {
    try {
      return await query();
    } catch (error) {
      console.error(`[REPOSITORY] Database error in ${this.constructor.name}:`, error);
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generic method to find by ID
  protected async findById(id: string | number): Promise<T | undefined> {
    return this.executeQuery(async () => {
      const table = this.getTable();
      const result = await this.db.select().from(table).where(table.id.eq(id)).limit(1);
      return result[0];
    });
  }

  // Generic method to find by condition
  protected async findBy(condition: SQL): Promise<T[]> {
    return this.executeQuery(async () => {
      const table = this.getTable();
      return await this.db.select().from(table).where(condition);
    });
  }

  // Generic method to count records
  protected async count(condition?: SQL): Promise<number> {
    return this.executeQuery(async () => {
      const table = this.getTable();
      const query = condition 
        ? this.db.select({ count: sql`count(*)` }).from(table).where(condition)
        : this.db.select({ count: sql`count(*)` }).from(table);
      
      const result = await query;
      return parseInt(result[0].count as string) || 0;
    });
  }

  // Generic method to check if record exists
  protected async exists(condition: SQL): Promise<boolean> {
    return this.executeQuery(async () => {
      const count = await this.count(condition);
      return count > 0;
    });
  }
}