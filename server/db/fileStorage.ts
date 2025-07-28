import fs from 'fs/promises';
import path from 'path';

export class FileStorage {
  private dataDir: string;

  constructor(dataDir = 'server/data') {
    this.dataDir = dataDir;
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.log('Data directory already exists or created');
    }
  }

  // Generic JSON file operations
  async readJSON<T>(filename: string): Promise<T | null> {
    try {
      const filepath = path.join(this.dataDir, `${filename}.json`);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async writeJSON<T>(filename: string, data: T): Promise<void> {
    const filepath = path.join(this.dataDir, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async appendToJSON<T>(filename: string, newData: T): Promise<void> {
    const existing = await this.readJSON<T[]>(filename) || [];
    if (Array.isArray(existing)) {
      existing.push(newData);
      await this.writeJSON(filename, existing);
    }
  }

  // Cache operations
  async setCache(key: string, data: any, ttlMinutes = 60): Promise<void> {
    const cacheData = {
      data,
      expires: Date.now() + (ttlMinutes * 60 * 1000)
    };
    await this.writeJSON(`cache_${key}`, cacheData);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cached = await this.readJSON<{data: T, expires: number}>(`cache_${key}`);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
  }

  // User preferences and settings
  async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    await this.writeJSON(`user_prefs_${userId}`, preferences);
  }

  async getUserPreferences(userId: string): Promise<any> {
    return await this.readJSON(`user_prefs_${userId}`);
  }

  // Analytics and logs
  async logEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    
    const today = new Date().toISOString().split('T')[0];
    await this.appendToJSON(`logs_${today}`, logEntry);
  }

  // Session data backup
  async saveSessionBackup(sessionId: string, sessionData: any): Promise<void> {
    await this.writeJSON(`session_${sessionId}`, {
      ...sessionData,
      savedAt: new Date().toISOString()
    });
  }

  async getSessionBackup(sessionId: string): Promise<any> {
    return await this.readJSON(`session_${sessionId}`);
  }

  // File listing
  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  // Clean up old files
  async cleanupOldFiles(daysOld = 30): Promise<void> {
    const files = await this.listFiles();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      try {
        const filepath = path.join(this.dataDir, file);
        const stats = await fs.stat(filepath);
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filepath);
        }
      } catch (error) {
        // File might have been deleted already
      }
    }
  }
}

export const fileStorage = new FileStorage();