# File-Based Storage Directory

This directory contains JSON files that act as additional database storage alongside PostgreSQL.

## File Types

### Cache Files (`cache_*.json`)
- Temporary data storage with TTL
- Used for API responses, computed data
- Automatically expires based on timestamp

### User Preferences (`user_prefs_*.json`)
- User-specific settings and preferences
- Theme choices, notification settings
- Privacy preferences, display options

### Session Backups (`session_*.json`)
- Session data backups for recovery
- User state preservation
- Login session information

### Logs (`logs_*.json`)
- Daily event logs
- User activity tracking
- Error and performance logs

### Analytics (`analytics_*.json`)
- User engagement metrics
- Feature usage statistics
- Performance data

## Usage Examples

```javascript
import { fileStorage } from './db/fileStorage';

// Cache data
await fileStorage.setCache('trending_posts', posts, 30); // 30 min TTL
const cached = await fileStorage.getCache('trending_posts');

// User preferences
await fileStorage.saveUserPreferences('user123', {
  theme: 'dark',
  notifications: true
});

// Log events
await fileStorage.logEvent('user_login', { userId: 'user123' });
```

## Maintenance

Files are automatically cleaned up after 30 days. You can manually clean older files:

```javascript
await fileStorage.cleanupOldFiles(7); // Clean files older than 7 days
```