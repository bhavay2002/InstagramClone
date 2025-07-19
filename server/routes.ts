import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
//import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuth as setupCustomAuth } from "./auth";
import { isAuthenticated } from "./isAuthenticated";
import crypto from "crypto";

import { insertPostSchema, insertCommentSchema, insertMessageSchema, insertStorySchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {

  await setupCustomAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let user: any;

      // Check if this is custom session auth
      if (req.session && req.session.user) {
        user = req.session.user;
        // Get full user data from database
        const fullUser = await storage.getUser(user.id);
        if (fullUser) {
          user = fullUser;
        }
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Return user data without password
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Custom logout endpoint
  app.post("/api/logout", (req: any, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: "Logout successful" });
      });
    } else {
      res.json({ message: "Logout successful" });
    }
  });

  // Custom login endpoint (this will override the one in auth.ts)
  app.post("/api/custom-login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session - ensure session is regenerated for security
      (req as any).session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        (req as any).session.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        };
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Session save error" });
          }

          const { password: _, ...safeUser } = user;
          res.json({ user: safeUser, message: "Login successful" });
        });
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });


  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, username } = req.body;

      if (!email || !password || !firstName || !lastName || !username)
        return res.status(400).json({ message: "All fields are required" });

      if (!email.includes("@"))
        return res.status(400).json({ message: "Invalid email format" });

      const [userByEmail, userByUsername] = await Promise.all([
        storage.getUserByEmail(email),
        storage.getUserByUsername(username)
      ]);

      if (userByEmail) return res.status(409).json({ message: "Email already exists" });
      if (userByUsername) return res.status(409).json({ message: "Username already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        username,
        firstName,
        lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { password: _, ...safeUser } = newUser;

      res.status(201).json({ user: safeUser });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });


  // User routes
  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      const userId = req.user.claims.sub;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUsers(q, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get('/api/users/:username', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;

      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/:userId/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const suggestions = await storage.getSuggestedUsers(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.user.claims.sub;

      if (userId === followerId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      await storage.followUser(followerId, userId);

      // Create notification
      await storage.createNotification({
        userId,
        fromUserId: followerId,
        type: 'follow',
        content: null,
        postId: null,
        commentId: null,
        isRead: false,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.user.claims.sub;

      await storage.unfollowUser(followerId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:userId/followers', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/users/:userId/following', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/users/:userId/following/:targetUserId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, targetUserId } = req.params;
      const isFollowing = await storage.isFollowing(userId, targetUserId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // Post routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({ ...req.body, userId });

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      const posts = await storage.getFeedPosts(userId, offset, limit);

      // Add user info and interaction states to posts
      const enrichedPosts = await Promise.all(posts.map(async (post: any) => {
        const postUser = await storage.getUser(post.userId);
        const hasLiked = await storage.hasLikedPost(userId, post.id);
        const hasSaved = await storage.hasSavedPost(userId, post.id);

        return {
          ...post,
          user: postUser,
          hasLiked,
          hasSaved
        };
      }));

      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const post = await storage.getPost(parseInt(id));

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const postUser = await storage.getUser(post.userId);
      const hasLiked = await storage.hasLikedPost(userId, post.id);
      const hasSaved = await storage.hasSavedPost(userId, post.id);

      res.json({
        ...post,
        user: postUser,
        hasLiked,
        hasSaved
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.get('/api/users/:userId/posts', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.put('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const post = await storage.getPost(parseInt(id));
      if (!post || post.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedPost = await storage.updatePost(parseInt(id), req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const post = await storage.getPost(parseInt(id));
      if (!post || post.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deletePost(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like routes
  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const hasLiked = await storage.hasLikedPost(userId, parseInt(id));
      if (hasLiked) {
        await storage.unlikePost(userId, parseInt(id));
      } else {
        await storage.likePost(userId, parseInt(id));

        // Create notification
        const post = await storage.getPost(parseInt(id));
        if (post && post.userId !== userId) {
          await storage.createNotification({
            userId: post.userId,
            fromUserId: userId,
            type: 'like',
            content: null,
            postId: parseInt(id),
            commentId: null,
            isRead: false,
          });
        }
      }

      res.json({ liked: !hasLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Save routes
  app.post('/api/posts/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const hasSaved = await storage.hasSavedPost(userId, parseInt(id));
      if (hasSaved) {
        await storage.unsavePost(userId, parseInt(id));
      } else {
        await storage.savePost(userId, parseInt(id));
      }

      res.json({ saved: !hasSaved });
    } catch (error) {
      console.error("Error toggling save:", error);
      res.status(500).json({ message: "Failed to toggle save" });
    }
  });

  app.get('/api/users/:userId/saved', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;

      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const savedPosts = await storage.getSavedPosts(userId);
      res.json(savedPosts);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      res.status(500).json({ message: "Failed to fetch saved posts" });
    }
  });

  // Comment routes
  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId: parseInt(id),
        userId
      });

      const comment = await storage.createComment(commentData);

      // Create notification
      const post = await storage.getPost(parseInt(id));
      if (post && post.userId !== userId) {
        await storage.createNotification({
          userId: post.userId,
          fromUserId: userId,
          type: 'comment',
          postId: parseInt(id),
          commentId: comment.id,
          content: comment.content,
          isRead: false,
        });
      }

      const commentUser = await storage.getUser(comment.userId);
      res.json({ ...comment, user: commentUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getPostComments(parseInt(id));

      const enrichedComments = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return { ...comment, user };
      }));

      res.json(enrichedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.put('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.claims.sub;

      const comment = await storage.updateComment(parseInt(id), content);
      res.json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteComment(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.post('/api/comments/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const hasLiked = await storage.hasLikedComment(userId, parseInt(id));
      if (hasLiked) {
        await storage.unlikeComment(userId, parseInt(id));
      } else {
        await storage.likeComment(userId, parseInt(id));
      }

      res.json({ liked: !hasLiked });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ message: "Failed to toggle comment like" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });

      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;

      const messages = await storage.getConversation(currentUserId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.put('/api/messages/:userId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;

      await storage.markMessagesAsRead(userId, currentUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  app.delete('/api/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessage(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Story routes
  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const storyData = insertStorySchema.parse({
        ...req.body,
        userId,
        expiresAt
      });

      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.get('/api/stories/following', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getFollowingStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching following stories:", error);
      res.status(500).json({ message: "Failed to fetch following stories" });
    }
  });

  app.get('/api/users/:userId/stories', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const stories = await storage.getActiveStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ message: "Failed to fetch user stories" });
    }
  });

  app.post('/api/stories/:id/view', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const viewerId = req.user.claims.sub;

      await storage.viewStory(parseInt(id), viewerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error viewing story:", error);
      res.status(500).json({ message: "Failed to view story" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const connectedUsers = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'auth') {
          userId = message.userId;
          if (userId) {
            connectedUsers.set(userId, ws);
          }
        } else if (message.type === 'message' && userId) {
          // Broadcast message to recipient if online
          const recipientWs = connectedUsers.get(message.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'new_message',
              message: message.data
            }));
          }
        } else if (message.type === 'notification' && userId) {
          // Broadcast notification to recipient if online
          const recipientWs = connectedUsers.get(message.userId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'new_notification',
              notification: message.data
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connectedUsers.delete(userId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userId) {
        connectedUsers.delete(userId);
      }
    });
  });

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
