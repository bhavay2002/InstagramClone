import { apiRequest, ApiError } from '@/lib/queryClient';
import { getUserFriendlyErrorMessage } from '@/lib/authUtils';
import type { 
  User, 
  Post, 
  Comment, 
  Message, 
  Story, 
  Notification,
  InsertPost,
  InsertComment,
  InsertMessage,
  InsertStory
} from '@shared/schema';

/**
 * Enhanced API response wrapper with error handling
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  try {
    if (!response.ok) {
      throw new ApiError(
        `${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        response.url,
        'UNKNOWN'
      );
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to parse response',
      0,
      'Parse Error',
      response.url,
      'UNKNOWN'
    );
  }
}

/**
 * User API service with comprehensive error handling and type safety
 */
export const userApi = {
  /**
   * Search for users by query string
   * @param query - Search query string
   * @param options - Additional search options
   * @returns Promise resolving to array of users
   */
  search: async (query: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> => {
    try {
      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/search?${params}`);
      return handleApiResponse<User[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to search users'));
    }
  },

  /**
   * Get user by username
   * @param username - Username to lookup
   * @returns Promise resolving to user object
   */
  getByUsername: async (username: string): Promise<User> => {
    try {
      if (!username?.trim()) {
        throw new Error('Username is required');
      }
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(username)}`);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to get user profile'));
    }
  },

  /**
   * Update user profile
   * @param data - Partial user data to update
   * @returns Promise resolving to updated user object
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required');
      }
      
      const response = await apiRequest('PUT', '/api/users/profile', data);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to update profile'));
    }
  },

  /**
   * Get suggested users to follow
   * @param limit - Maximum number of suggestions to return
   * @returns Promise resolving to array of suggested users
   */
  getSuggestions: async (limit: number = 10): Promise<User[]> => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await apiRequest('GET', `/api/users/suggestions?${params}`);
      return handleApiResponse<User[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to get user suggestions'));
    }
  },

  /**
   * Follow a user
   * @param userId - ID of user to follow
   * @returns Promise resolving when follow is complete
   */
  follow: async (userId: string): Promise<{ success: boolean }> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const response = await apiRequest('POST', `/api/users/${encodeURIComponent(userId)}/follow`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to follow user'));
    }
  },

  /**
   * Unfollow a user
   * @param userId - ID of user to unfollow
   * @returns Promise resolving when unfollow is complete
   */
  unfollow: async (userId: string): Promise<{ success: boolean }> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/users/${encodeURIComponent(userId)}/follow`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to unfollow user'));
    }
  },

  /**
   * Get user followers
   * @param userId - ID of user to get followers for
   * @param options - Pagination options
   * @returns Promise resolving to array of followers
   */
  getFollowers: async (userId: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}/followers?${params}`);
      return handleApiResponse<User[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to get followers'));
    }
  },

  /**
   * Get users that a user is following
   * @param userId - ID of user to get following list for
   * @param options - Pagination options
   * @returns Promise resolving to array of followed users
   */
  getFollowing: async (userId: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}/following?${params}`);
      return handleApiResponse<User[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to get following list'));
    }
  },

  /**
   * Check if one user is following another
   * @param userId - ID of the user doing the following
   * @param targetUserId - ID of the user being followed
   * @returns Promise resolving to follow status
   */
  isFollowing: async (userId: string, targetUserId: string): Promise<{ isFollowing: boolean }> => {
    try {
      if (!userId?.trim() || !targetUserId?.trim()) {
        throw new Error('Both user IDs are required');
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/users/${encodeURIComponent(userId)}/following/${encodeURIComponent(targetUserId)}`
      );
      return handleApiResponse<{ isFollowing: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to check follow status'));
    }
  },
};

/**
 * Post API service with comprehensive error handling and validation
 */
export const postApi = {
  /**
   * Create a new post
   * @param post - Post data to create
   * @returns Promise resolving to created post
   */
  create: async (post: InsertPost): Promise<Post> => {
    try {
      if (!post || !post.media || !post.mediaType) {
        throw new Error('Post media and media type are required');
      }
      
      const response = await apiRequest('POST', '/api/posts', post);
      return handleApiResponse<Post>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to create post'));
    }
  },

  /**
   * Get posts for the user's feed
   * @param options - Pagination and filtering options
   * @returns Promise resolving to array of posts
   */
  getFeed: async (options: { 
    offset?: number; 
    limit?: number; 
    userId?: string;
  } = {}): Promise<Post[]> => {
    try {
      const { offset = 0, limit = 10, userId } = options;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: Math.min(limit, 50).toString(), // Cap at 50 for performance
      });
      
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await apiRequest('GET', `/api/posts/feed?${params}`);
      return handleApiResponse<Post[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load feed'));
    }
  },

  /**
   * Get a specific post by ID
   * @param id - Post ID
   * @returns Promise resolving to post object
   */
  getById: async (id: number): Promise<Post> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      const response = await apiRequest('GET', `/api/posts/${id}`);
      return handleApiResponse<Post>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load post'));
    }
  },

  /**
   * Get posts by a specific user
   * @param userId - User ID to get posts for
   * @param options - Pagination options
   * @returns Promise resolving to array of user's posts
   */
  getUserPosts: async (userId: string, options: { 
    offset?: number; 
    limit?: number; 
  } = {}): Promise<Post[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { offset = 0, limit = 20 } = options;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}/posts?${params}`);
      return handleApiResponse<Post[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load user posts'));
    }
  },

  /**
   * Update a post
   * @param id - Post ID to update
   * @param data - Partial post data to update
   * @returns Promise resolving to updated post
   */
  update: async (id: number, data: Partial<Post>): Promise<Post> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required');
      }
      
      const response = await apiRequest('PUT', `/api/posts/${id}`, data);
      return handleApiResponse<Post>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to update post'));
    }
  },

  /**
   * Delete a post
   * @param id - Post ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete: async (id: number): Promise<{ success: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/posts/${id}`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to delete post'));
    }
  },

  /**
   * Toggle like status on a post
   * @param id - Post ID to like/unlike
   * @returns Promise resolving to like status
   */
  like: async (id: number): Promise<{ liked: boolean; likesCount: number }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      const response = await apiRequest('POST', `/api/posts/${id}/like`);
      return handleApiResponse<{ liked: boolean; likesCount: number }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to like post'));
    }
  },

  /**
   * Toggle save status on a post
   * @param id - Post ID to save/unsave
   * @returns Promise resolving to save status
   */
  save: async (id: number): Promise<{ saved: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      const response = await apiRequest('POST', `/api/posts/${id}/save`);
      return handleApiResponse<{ saved: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to save post'));
    }
  },

  /**
   * Get user's saved posts
   * @param userId - User ID to get saved posts for
   * @param options - Pagination options
   * @returns Promise resolving to array of saved posts
   */
  getSavedPosts: async (userId: string, options: { 
    offset?: number; 
    limit?: number; 
  } = {}): Promise<Post[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { offset = 0, limit = 20 } = options;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}/saved?${params}`);
      return handleApiResponse<Post[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load saved posts'));
    }
  },
};

/**
 * Comment API service with comprehensive error handling and validation
 */
export const commentApi = {
  /**
   * Create a new comment on a post
   * @param postId - Post ID to comment on
   * @param comment - Comment data
   * @returns Promise resolving to created comment
   */
  create: async (postId: number, comment: Omit<InsertComment, 'postId'>): Promise<Comment> => {
    try {
      if (!postId || postId <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      if (!comment?.content || typeof comment.content !== 'string' || !comment.content.trim()) {
        throw new Error('Comment content is required');
      }
      
      const response = await apiRequest('POST', `/api/posts/${postId}/comments`, comment);
      return handleApiResponse<Comment>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to create comment'));
    }
  },

  /**
   * Get comments for a specific post
   * @param postId - Post ID to get comments for
   * @param options - Pagination and sorting options
   * @returns Promise resolving to array of comments
   */
  getByPost: async (postId: number, options: {
    offset?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'likes';
  } = {}): Promise<Comment[]> => {
    try {
      if (!postId || postId <= 0) {
        throw new Error('Valid post ID is required');
      }
      
      const { offset = 0, limit = 20, sortBy = 'newest' } = options;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
        sortBy,
      });
      
      const response = await apiRequest('GET', `/api/posts/${postId}/comments?${params}`);
      return handleApiResponse<Comment[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load comments'));
    }
  },

  /**
   * Update a comment
   * @param id - Comment ID to update
   * @param content - New comment content
   * @returns Promise resolving to updated comment
   */
  update: async (id: number, content: string): Promise<Comment> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid comment ID is required');
      }
      
      if (!content?.trim()) {
        throw new Error('Comment content is required');
      }
      
      const response = await apiRequest('PUT', `/api/comments/${id}`, { content: content.trim() });
      return handleApiResponse<Comment>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to update comment'));
    }
  },

  /**
   * Delete a comment
   * @param id - Comment ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete: async (id: number): Promise<{ success: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid comment ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/comments/${id}`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to delete comment'));
    }
  },

  /**
   * Toggle like status on a comment
   * @param id - Comment ID to like/unlike
   * @returns Promise resolving to like status
   */
  like: async (id: number): Promise<{ liked: boolean; likesCount: number }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid comment ID is required');
      }
      
      const response = await apiRequest('POST', `/api/comments/${id}/like`);
      return handleApiResponse<{ liked: boolean; likesCount: number }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to like comment'));
    }
  },

  /**
   * Get replies to a specific comment
   * @param commentId - Parent comment ID
   * @param options - Pagination options
   * @returns Promise resolving to array of reply comments
   */
  getReplies: async (commentId: number, options: {
    offset?: number;
    limit?: number;
  } = {}): Promise<Comment[]> => {
    try {
      if (!commentId || commentId <= 0) {
        throw new Error('Valid comment ID is required');
      }
      
      const { offset = 0, limit = 10 } = options;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiRequest('GET', `/api/comments/${commentId}/replies?${params}`);
      return handleApiResponse<Comment[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load replies'));
    }
  },
};

/**
 * Message API service with comprehensive error handling and validation
 */
export const messageApi = {
  /**
   * Send a message to another user
   * @param message - Message data to send
   * @returns Promise resolving to sent message
   */
  send: async (message: InsertMessage): Promise<Message> => {
    try {
      if (!message?.content?.trim() || !message?.receiverId?.trim()) {
        throw new Error('Message content and receiver ID are required');
      }
      
      const response = await apiRequest('POST', '/api/messages', message);
      return handleApiResponse<Message>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to send message'));
    }
  },

  /**
   * Get all conversations for the current user
   * @param options - Pagination options
   * @returns Promise resolving to array of conversations
   */
  getConversations: async (options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ user: User; lastMessage: Message }[]> => {
    try {
      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await apiRequest('GET', `/api/messages/conversations?${params}`);
      return handleApiResponse<{ user: User; lastMessage: Message }[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load conversations'));
    }
  },

  /**
   * Get messages in a conversation with a specific user
   * @param userId - User ID to get conversation with
   * @param options - Pagination options
   * @returns Promise resolving to array of messages
   */
  getConversation: async (userId: string, options: {
    limit?: number;
    offset?: number;
    before?: string; // For pagination by timestamp
  } = {}): Promise<Message[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { limit = 50, offset = 0, before } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (before) {
        params.append('before', before);
      }
      
      const response = await apiRequest('GET', `/api/messages/${encodeURIComponent(userId)}?${params}`);
      return handleApiResponse<Message[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load conversation'));
    }
  },

  /**
   * Mark all messages in a conversation as read
   * @param userId - User ID to mark conversation as read with
   * @returns Promise resolving when messages are marked as read
   */
  markAsRead: async (userId: string): Promise<{ success: boolean }> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const response = await apiRequest('PUT', `/api/messages/${encodeURIComponent(userId)}/read`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to mark messages as read'));
    }
  },

  /**
   * Delete a specific message
   * @param id - Message ID to delete
   * @returns Promise resolving when message is deleted
   */
  delete: async (id: number): Promise<{ success: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid message ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/messages/${id}`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to delete message'));
    }
  },
};

/**
 * Story API service with comprehensive error handling and validation
 */
export const storyApi = {
  /**
   * Create a new story
   * @param story - Story data to create
   * @returns Promise resolving to created story
   */
  create: async (story: Omit<InsertStory, 'expiresAt'>): Promise<Story> => {
    try {
      if (!story?.mediaUrl?.trim() || !story?.mediaType?.trim()) {
        throw new Error('Story media URL and media type are required');
      }
      
      const response = await apiRequest('POST', '/api/stories', story);
      return handleApiResponse<Story>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to create story'));
    }
  },

  /**
   * Get stories from users that the current user is following
   * @param options - Filtering options
   * @returns Promise resolving to grouped stories by user
   */
  getFollowingStories: async (options: {
    activeOnly?: boolean;
  } = {}): Promise<{ user: User; stories: Story[] }[]> => {
    try {
      const { activeOnly = true } = options;
      const params = new URLSearchParams({
        activeOnly: activeOnly.toString(),
      });
      
      const response = await apiRequest('GET', `/api/stories/following?${params}`);
      return handleApiResponse<{ user: User; stories: Story[] }[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load stories'));
    }
  },

  /**
   * Get stories by a specific user
   * @param userId - User ID to get stories for
   * @param options - Filtering options
   * @returns Promise resolving to array of user's stories
   */
  getUserStories: async (userId: string, options: {
    activeOnly?: boolean;
    limit?: number;
  } = {}): Promise<Story[]> => {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      
      const { activeOnly = true, limit = 10 } = options;
      const params = new URLSearchParams({
        activeOnly: activeOnly.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}/stories?${params}`);
      return handleApiResponse<Story[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load user stories'));
    }
  },

  /**
   * Mark a story as viewed
   * @param storyId - Story ID to mark as viewed
   * @returns Promise resolving when view is recorded
   */
  view: async (storyId: number): Promise<{ success: boolean; viewsCount: number }> => {
    try {
      if (!storyId || storyId <= 0) {
        throw new Error('Valid story ID is required');
      }
      
      const response = await apiRequest('POST', `/api/stories/${storyId}/view`);
      return handleApiResponse<{ success: boolean; viewsCount: number }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to view story'));
    }
  },

  /**
   * Delete a story
   * @param storyId - Story ID to delete
   * @returns Promise resolving when story is deleted
   */
  delete: async (storyId: number): Promise<{ success: boolean }> => {
    try {
      if (!storyId || storyId <= 0) {
        throw new Error('Valid story ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/stories/${storyId}`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to delete story'));
    }
  },
};

/**
 * Notification API service with comprehensive error handling and validation
 */
export const notificationApi = {
  /**
   * Get all notifications for the current user
   * @param options - Pagination and filtering options
   * @returns Promise resolving to array of notifications
   */
  getAll: async (options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<Notification[]> => {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        unreadOnly: unreadOnly.toString(),
      });
      
      const response = await apiRequest('GET', `/api/notifications?${params}`);
      return handleApiResponse<Notification[]>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to load notifications'));
    }
  },

  /**
   * Mark a specific notification as read
   * @param id - Notification ID to mark as read
   * @returns Promise resolving when notification is marked as read
   */
  markAsRead: async (id: number): Promise<{ success: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid notification ID is required');
      }
      
      const response = await apiRequest('PUT', `/api/notifications/${id}/read`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to mark notification as read'));
    }
  },

  /**
   * Mark all notifications as read
   * @returns Promise resolving when all notifications are marked as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiRequest('PUT', '/api/notifications/read-all');
      return handleApiResponse<{ success: boolean; count: number }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to mark all notifications as read'));
    }
  },

  /**
   * Delete a notification
   * @param id - Notification ID to delete
   * @returns Promise resolving when notification is deleted
   */
  delete: async (id: number): Promise<{ success: boolean }> => {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid notification ID is required');
      }
      
      const response = await apiRequest('DELETE', `/api/notifications/${id}`);
      return handleApiResponse<{ success: boolean }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to delete notification'));
    }
  },

  /**
   * Get unread notification count
   * @returns Promise resolving to unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    try {
      const response = await apiRequest('GET', '/api/notifications/unread-count');
      return handleApiResponse<{ count: number }>(response);
    } catch (error) {
      throw new Error(getUserFriendlyErrorMessage(error, 'Failed to get unread count'));
    }
  },
};

// Export all APIs
export const api = {
  users: userApi,
  posts: postApi,
  comments: commentApi,
  messages: messageApi,
  stories: storyApi,
  notifications: notificationApi,
};

export default api;
