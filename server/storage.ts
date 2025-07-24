import {
  users,
  posts,
  comments,
  likes,
  follows,
  messages,
  stories,
  storyViews,
  notifications,
  savedPosts,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Message,
  type InsertMessage,
  type Story,
  type InsertStory,
  type Follow,
  type Like,
  type Notification,
  type SavedPost,
} from "@shared/schema";
import { db } from "./db/db";
import { eq, desc, and, or, sql, count, exists, not, gt, lt } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getSuggestedUsers(userId: string): Promise<User[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: string): Promise<Post[]>;
  getFeedPosts(userId: string, offset?: number, limit?: number): Promise<Post[]>;
  updatePost(id: number, data: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  
  // Like operations
  likePost(userId: string, postId: number): Promise<void>;
  unlikePost(userId: string, postId: number): Promise<void>;
  likeComment(userId: string, commentId: number): Promise<void>;
  unlikeComment(userId: string, commentId: number): Promise<void>;
  hasLikedPost(userId: string, postId: number): Promise<boolean>;
  hasLikedComment(userId: string, commentId: number): Promise<boolean>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: number): Promise<Comment[]>;
  updateComment(id: number, content: string): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  
  // Save operations
  savePost(userId: string, postId: number): Promise<void>;
  unsavePost(userId: string, postId: number): Promise<void>;
  getSavedPosts(userId: string): Promise<Post[]>;
  hasSavedPost(userId: string, postId: number): Promise<boolean>;
  
  // Message operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<{ user: User; lastMessage: Message }[]>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  deleteMessage(id: number): Promise<void>;
  
  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(userId: string): Promise<Story[]>;
  getFollowingStories(userId: string): Promise<{ user: User; stories: Story[] }[]>;
  viewStory(storyId: number, viewerId: string): Promise<void>;
  deleteExpiredStories(): Promise<void>;
  
  // Notification operations
  createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          or(
            sql`${users.username} ILIKE ${`%${query}%`}`,
            sql`${users.firstName} ILIKE ${`%${query}%`}`,
            sql`${users.lastName} ILIKE ${`%${query}%`}`
          ),
          not(eq(users.id, currentUserId))
        )
      )
      .limit(20);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(follows).values({ followerId, followingId });
      await tx.update(users).set({ 
        followingCount: sql`${users.followingCount} + 1` 
      }).where(eq(users.id, followerId));
      await tx.update(users).set({ 
        followerCount: sql`${users.followerCount} + 1` 
      }).where(eq(users.id, followingId));
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(follows).where(
        and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
      );
      await tx.update(users).set({ 
        followingCount: sql`${users.followingCount} - 1` 
      }).where(eq(users.id, followerId));
      await tx.update(users).set({ 
        followerCount: sql`${users.followerCount} - 1` 
      }).where(eq(users.id, followingId));
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

async getFollowers(userId: string): Promise<User[]> {
  const result = await db
    .select()
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId));

  return result.map((row) => row.users);
}


  async getFollowing(userId: string): Promise<User[]> {
  const result = await db
    .select()
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId));

  return result.map((row) => row.users);
}


  async getSuggestedUsers(userId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          not(eq(users.id, userId)),
          not(exists(
            db.select().from(follows).where(
              and(eq(follows.followerId, userId), eq(follows.followingId, users.id))
            )
          ))
        )
      )
      .limit(5);
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.transaction(async (tx) => {
      const [created] = await tx.insert(posts).values(post).returning();
      await tx.update(users).set({ 
        postCount: sql`${users.postCount} + 1` 
      }).where(eq(users.id, post.userId));
      return [created];
    });
    return newPost;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getFeedPosts(userId: string, offset = 0, limit = 10): Promise<Post[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        caption: posts.caption,
        media: posts.media,
        mediaType: posts.mediaType,
        location: posts.location,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .innerJoin(follows, eq(posts.userId, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(posts.createdAt))
      .offset(offset)
      .limit(limit);
    
    return results;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const [post] = await db.update(posts).set(data).where(eq(posts.id, id)).returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) {
      await db.transaction(async (tx) => {
        await tx.delete(posts).where(eq(posts.id, id));
        await tx.update(users).set({ 
          postCount: sql`${users.postCount} - 1` 
        }).where(eq(users.id, post.userId));
      });
    }
  }

  // Like operations
  async likePost(userId: string, postId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(likes).values({ userId, postId });
      await tx.update(posts).set({ 
        likesCount: sql`${posts.likesCount} + 1` 
      }).where(eq(posts.id, postId));
    });
  }

  async unlikePost(userId: string, postId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
      await tx.update(posts).set({ 
        likesCount: sql`${posts.likesCount} - 1` 
      }).where(eq(posts.id, postId));
    });
  }

  async likeComment(userId: string, commentId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(likes).values({ userId, commentId });
      await tx.update(comments).set({ 
        likesCount: sql`${comments.likesCount} + 1` 
      }).where(eq(comments.id, commentId));
    });
  }

  async unlikeComment(userId: string, commentId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(and(eq(likes.userId, userId), eq(likes.commentId, commentId)));
      await tx.update(comments).set({ 
        likesCount: sql`${comments.likesCount} - 1` 
      }).where(eq(comments.id, commentId));
    });
  }

  async hasLikedPost(userId: string, postId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return !!like;
  }

  async hasLikedComment(userId: string, commentId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.commentId, commentId)));
    return !!like;
  }

async createComment(comment: InsertComment): Promise<Comment> {
  return await db.transaction(async (tx) => {
    const [newComment] = await tx
      .insert(comments)
      .values(comment)
      .returning() as Comment[];

    if (!newComment) throw new Error("Failed to insert comment");

    if (typeof comment.postId !== "number") {
      throw new Error("Invalid postId");
    }

    await tx
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, comment.postId));

    return newComment;
  });
}

  async getPostComments(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async updateComment(id: number, content: string): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db.transaction(async (tx) => {
        await tx.delete(comments).where(eq(comments.id, id));
        await tx.update(posts).set({ 
          commentsCount: sql`${posts.commentsCount} - 1` 
        }).where(eq(posts.id, comment.postId));
      });
    }
  }

  // Save operations
  async savePost(userId: string, postId: number): Promise<void> {
    await db.insert(savedPosts).values({ userId, postId });
  }

  async unsavePost(userId: string, postId: number): Promise<void> {
    await db.delete(savedPosts).where(
      and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId))
    );
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    return await db
      .select({
        id: posts.id,
        userId: posts.userId,
        caption: posts.caption,
        media: posts.media,
        mediaType: posts.mediaType,
        location: posts.location,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
      })
      .from(savedPosts)
      .innerJoin(posts, eq(savedPosts.postId, posts.id))
      .where(eq(savedPosts.userId, userId))
      .orderBy(desc(savedPosts.createdAt));
  }

  async hasSavedPost(userId: string, postId: number): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedPosts)
      .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
    return !!saved;
  }

  // Message operations
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<{ user: User; lastMessage: Message }[]> {
    // This is a complex query that would need to be optimized in production
    const conversations = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, { user: User; lastMessage: Message }>();
    
    for (const message of conversations) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversationMap.has(otherUserId)) {
        const user = await this.getUser(otherUserId);
        if (user) {
          conversationMap.set(otherUserId, { user, lastMessage: message });
        }
      }
    }

    return Array.from(conversationMap.values());
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Story operations
  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async getActiveStories(userId: string): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(and(eq(stories.userId, userId), gt(stories.expiresAt, new Date())))
      .orderBy(desc(stories.createdAt));
  }

  async getFollowingStories(userId: string): Promise<{ user: User; stories: Story[] }[]> {
    const followingUsers = await this.getFollowing(userId);
    const result: { user: User; stories: Story[] }[] = [];

    for (const user of followingUsers) {
      const activeStories = await this.getActiveStories(user.id);
      if (activeStories.length > 0) {
        result.push({ user, stories: activeStories });
      }
    }

    return result;
  }

  async viewStory(storyId: number, viewerId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(storyViews)
      .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, viewerId)));

    if (!existing) {
      await db.transaction(async (tx) => {
        await tx.insert(storyViews).values({ storyId, viewerId });
        await tx.update(stories).set({ 
          viewsCount: sql`${stories.viewsCount} + 1` 
        }).where(eq(stories.id, storyId));
      });
    }
  }

  async deleteExpiredStories(): Promise<void> {
    await db.delete(stories).where(lt(stories.expiresAt, new Date()));
  }

  // Notification operations
  async createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<void> {
    await db.insert(notifications).values(notification);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
