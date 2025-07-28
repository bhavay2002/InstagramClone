import { Request, Response } from 'express';
import { fileStorage } from '../db/fileStorage';
import asyncHandler from 'express-async-handler';
import { User } from '../../shared/schema';

// User preferences
export const getUserPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req.user as User)?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const preferences = await fileStorage.getUserPreferences(userId) || {
    theme: 'light',
    notifications: true,
    privacy: 'public',
    language: 'en'
  };

  res.json(preferences);
});

export const updateUserPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req.user as User)?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const preferences = req.body;
  await fileStorage.saveUserPreferences(userId, preferences);
  
  // Log preference change
  await fileStorage.logEvent('preferences_updated', {
    userId,
    preferences: Object.keys(preferences)
  });

  res.json({ message: 'Preferences updated successfully' });
});

// Analytics and logs
export const getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req.user as User)?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get cached analytics or generate new ones
  let analytics = await fileStorage.getCache(`analytics_${userId}`);
  
  if (!analytics) {
    // Generate analytics data (in real app, this would compute from actual data)
    analytics = {
      postsThisWeek: 3,
      likesReceived: 75,
      messagesCount: 12,
      profileViews: 156,
      engagementRate: 8.5,
      topPost: {
        id: 12,
        likes: 32,
        caption: "Beautiful sunset from my balcony today 🌅"
      }
    };
    
    // Cache for 1 hour
    await fileStorage.setCache(`analytics_${userId}`, analytics, 60);
  }

  res.json(analytics);
});

// System data
export const getSystemStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const files = await fileStorage.listFiles();
  const stats = {
    totalFiles: files.length,
    cacheFiles: files.filter(f => f.startsWith('cache_')).length,
    logFiles: files.filter(f => f.startsWith('logs_')).length,
    userPrefsFiles: files.filter(f => f.startsWith('user_prefs_')).length,
    lastUpdated: new Date().toISOString()
  };

  res.json(stats);
});

// Export data backup
export const exportUserData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req.user as User)?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userData = {
    preferences: await fileStorage.getUserPreferences(userId),
    analytics: await fileStorage.getCache(`analytics_${userId}`),
    exportedAt: new Date().toISOString()
  };

  // Save backup
  await fileStorage.writeJSON(`backup_${userId}_${Date.now()}`, userData);
  
  res.json({
    message: 'Data exported successfully',
    data: userData
  });
});