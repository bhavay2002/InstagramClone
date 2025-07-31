import { eq, like, and, or, sql, count, exists, not } from "drizzle-orm";
import { BaseRepository } from "./base.repository";
import { users, follows, type User, type UpsertUser } from "@shared/schema";

export class UserRepository extends BaseRepository<User> {
  protected getTable() {
    return users;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.executeQuery(async () => {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.executeQuery(async () => {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.executeQuery(async () => {
      const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    });
  }

  async create(userData: UpsertUser): Promise<User> {
    return this.executeQuery(async () => {
      const result = await this.db.insert(users).values(userData).returning();
      if (!result[0]) {
        throw new Error("Failed to create user");
      }
      return result[0];
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.executeQuery(async () => {
      const result = await this.db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error("User not found or update failed");
      }
      return result[0];
    });
  }

  async search(query: string, currentUserId: string, limit: number = 20): Promise<User[]> {
    return this.executeQuery(async () => {
      const searchTerm = `%${query.toLowerCase()}%`;
      return await this.db
        .select()
        .from(users)
        .where(
          and(
            not(eq(users.id, currentUserId)),
            or(
              like(sql`LOWER(${users.username})`, searchTerm),
              like(sql`LOWER(${users.firstName})`, searchTerm),
              like(sql`LOWER(${users.lastName})`, searchTerm),
              like(sql`LOWER(${users.email})`, searchTerm)
            )
          )
        )
        .limit(limit);
    });
  }

  async getSuggestedUsers(currentUserId: string, limit: number = 10): Promise<User[]> {
    return this.executeQuery(async () => {
      return await this.db
        .select()
        .from(users)
        .where(
          and(
            not(eq(users.id, currentUserId)),
            not(
              exists(
                this.db
                  .select()
                  .from(follows)
                  .where(
                    and(
                      eq(follows.followerId, currentUserId),
                      eq(follows.followingId, users.id)
                    )
                  )
              )
            )
          )
        )
        .limit(limit);
    });
  }

  async getFollowers(userId: string): Promise<User[]> {
    return this.executeQuery(async () => {
      return await this.db
        .select()
        .from(users)
        .innerJoin(follows, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId))
        .then(results => results.map(result => result.users));
    });
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.executeQuery(async () => {
      return await this.db
        .select()
        .from(users)
        .innerJoin(follows, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId))
        .then(results => results.map(result => result.users));
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.executeQuery(async () => {
      const result = await this.db
        .select({ count: count() })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      return (result[0]?.count || 0) > 0;
    });
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await this.executeQuery(async () => {
      await this.db.insert(follows).values({
        followerId,
        followingId,
        createdAt: new Date(),
      });
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.executeQuery(async () => {
      await this.db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
    });
  }
}