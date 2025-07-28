import { Router } from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated';
import {
  getUserPreferences,
  updateUserPreferences,
  getAnalytics,
  getSystemStats,
  exportUserData
} from '../controllers/fileData.controller';

const router = Router();

// User preferences routes
router.get('/preferences', isAuthenticated, getUserPreferences);
router.put('/preferences', isAuthenticated, updateUserPreferences);

// Analytics routes
router.get('/analytics', isAuthenticated, getAnalytics);

// System stats (admin-level)
router.get('/system-stats', getSystemStats);

// Data export
router.get('/export', isAuthenticated, exportUserData);

export default router;