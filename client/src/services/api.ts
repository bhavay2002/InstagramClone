import { apiRequest } from '@/lib/queryClient';
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

// User API
export const userApi = {
  search: async (query: string): Promise<User[]> => {
    const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getByUsername: async (username: string): Promise<User> => {
    const response = await apiRequest('GET', `/api/users/${username}`);
    return response.json();
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiRequest('PUT', '/api/users/profile', data);
    return response.json();
  },

  getSuggestions: async (): Promise<User[]> => {
    const response = await apiRequest('GET', '/api/users/suggestions');
    return response.json();
  },

  follow: async (userId: string): Promise<void> => {
    await apiRequest('POST', `/api/users/${userId}/follow`);
  },

  unfollow: async (userId: string): Promise<void> => {
    await apiRequest('DELETE', `/api/users/${userId}/follow`);
  },

  getFollowers: async (userId: string): Promise<User[]> => {
    const response = await apiRequest('GET', `/api/users/${userId}/followers`);
    return response.json();
  },

  getFollowing: async (userId: string): Promise<User[]> => {
    const response = await apiRequest('GET', `/api/users/${userId}/following`);
    return response.json();
  },

  isFollowing: async (userId: string, targetUserId: string): Promise<{ isFollowing: boolean }> => {
    const response = await apiRequest('GET', `/api/users/${userId}/following/${targetUserId}`);
    return response.json();
  },
};

// Post API
export const postApi = {
  create: async (post: InsertPost): Promise<Post> => {
    const response = await apiRequest('POST', '/api/posts', post);
    return response.json();
  },

  getFeed: async (offset = 0, limit = 10): Promise<Post[]> => {
    const response = await apiRequest('GET', `/api/posts/feed?offset=${offset}&limit=${limit}`);
    return response.json();
  },

  getById: async (id: number): Promise<Post> => {
    const response = await apiRequest('GET', `/api/posts/${id}`);
    return response.json();
  },

  getUserPosts: async (userId: string): Promise<Post[]> => {
    const response = await apiRequest('GET', `/api/users/${userId}/posts`);
    return response.json();
  },

  update: async (id: number, data: Partial<Post>): Promise<Post> => {
    const response = await apiRequest('PUT', `/api/posts/${id}`, data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/posts/${id}`);
  },

  like: async (id: number): Promise<{ liked: boolean }> => {
    const response = await apiRequest('POST', `/api/posts/${id}/like`);
    return response.json();
  },

  save: async (id: number): Promise<{ saved: boolean }> => {
    const response = await apiRequest('POST', `/api/posts/${id}/save`);
    return response.json();
  },

  getSavedPosts: async (userId: string): Promise<Post[]> => {
    const response = await apiRequest('GET', `/api/users/${userId}/saved`);
    return response.json();
  },
};

// Comment API
export const commentApi = {
  create: async (postId: number, comment: Omit<InsertComment, 'postId'>): Promise<Comment> => {
    const response = await apiRequest('POST', `/api/posts/${postId}/comments`, comment);
    return response.json();
  },

  getByPost: async (postId: number): Promise<Comment[]> => {
    const response = await apiRequest('GET', `/api/posts/${postId}/comments`);
    return response.json();
  },

  update: async (id: number, content: string): Promise<Comment> => {
    const response = await apiRequest('PUT', `/api/comments/${id}`, { content });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/comments/${id}`);
  },

  like: async (id: number): Promise<{ liked: boolean }> => {
    const response = await apiRequest('POST', `/api/comments/${id}/like`);
    return response.json();
  },
};

// Message API
export const messageApi = {
  send: async (message: InsertMessage): Promise<Message> => {
    const response = await apiRequest('POST', '/api/messages', message);
    return response.json();
  },

  getConversations: async (): Promise<{ user: User; lastMessage: Message }[]> => {
    const response = await apiRequest('GET', '/api/messages/conversations');
    return response.json();
  },

  getConversation: async (userId: string): Promise<Message[]> => {
    const response = await apiRequest('GET', `/api/messages/${userId}`);
    return response.json();
  },

  markAsRead: async (userId: string): Promise<void> => {
    await apiRequest('PUT', `/api/messages/${userId}/read`);
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/messages/${id}`);
  },
};

// Story API
export const storyApi = {
  create: async (story: Omit<InsertStory, 'expiresAt'>): Promise<Story> => {
    const response = await apiRequest('POST', '/api/stories', story);
    return response.json();
  },

  getFollowingStories: async (): Promise<{ user: User; stories: Story[] }[]> => {
    const response = await apiRequest('GET', '/api/stories/following');
    return response.json();
  },

  getUserStories: async (userId: string): Promise<Story[]> => {
    const response = await apiRequest('GET', `/api/users/${userId}/stories`);
    return response.json();
  },

  view: async (storyId: number): Promise<void> => {
    await apiRequest('POST', `/api/stories/${storyId}/view`);
  },
};

// Notification API
export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiRequest('GET', '/api/notifications');
    return response.json();
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiRequest('PUT', `/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiRequest('PUT', '/api/notifications/read-all');
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
