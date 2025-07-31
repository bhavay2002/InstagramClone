import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserFriendlyErrorMessage } from '@/lib/authUtils';

/**
 * WebSocket message type definitions
 */
export interface WebSocketMessage {
  type: string;
  timestamp?: number;
  id?: string;
  [key: string]: unknown;
}

/**
 * Specific message type interfaces
 */
export interface AuthMessage extends WebSocketMessage {
  type: 'auth';
  userId: string;
  token?: string;
}

export interface ChatMessage extends WebSocketMessage {
  type: 'message';
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'video';
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  userId: string;
  notificationType: 'like' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  postId?: number;
  commentId?: number;
}

export interface StatusMessage extends WebSocketMessage {
  type: 'status';
  status: 'online' | 'offline' | 'typing';
  userId: string;
}

/**
 * Message handler type
 */
export type MessageHandler = (data: WebSocketMessage) => void;

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING', 
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

/**
 * WebSocket service configuration
 */
interface WebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

/**
 * Enhanced WebSocket service with improved reliability and error handling
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private heartbeatInterval: number;
  private messageTimeout: number;
  private userId: string | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pendingMessages: WebSocketMessage[] = [];
  private messageQueue: WebSocketMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig = {}) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectInterval = config.reconnectInterval ?? 1000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
    this.messageTimeout = config.messageTimeout ?? 10000;
  }

  /**
   * Connect to WebSocket server
   * @param userId - User ID for authentication
   * @param token - Optional authentication token
   */
  connect(userId: string, token?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    this.connectionState = ConnectionState.CONNECTING;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setupSocketHandlers(userId, token);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionState = ConnectionState.ERROR;
      this.handleReconnect();
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupSocketHandlers(userId: string, token?: string): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.connectionState = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      
      // Send authentication message
      this.sendImmediately({
        type: 'auth',
        userId,
        token,
        timestamp: Date.now(),
      });

      // Start heartbeat
      this.startHeartbeat();
      
      // Send queued messages
      this.flushMessageQueue();
      
      this.notifyHandlers('connection', { type: 'connection', status: 'connected' });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
      this.connectionState = ConnectionState.DISCONNECTED;
      this.stopHeartbeat();
      
      this.notifyHandlers('connection', { 
        type: 'connection', 
        status: 'disconnected',
        code: event.code,
        reason: event.reason,
      });

      // Only attempt reconnect if it wasn't a normal closure
      if (event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionState = ConnectionState.ERROR;
      
      this.notifyHandlers('error', {
        type: 'error',
        error: getUserFriendlyErrorMessage(error, 'WebSocket connection error'),
      });
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    
    this.connectionState = ConnectionState.DISCONNECTED;
    this.messageHandlers.clear();
    this.messageQueue = [];
    this.pendingMessages = [];
    this.userId = null;
  }

  /**
   * Send a message immediately (for internal use)
   */
  private sendImmediately(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          ...message,
          id: message.id || this.generateMessageId(),
          timestamp: message.timestamp || Date.now(),
        }));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  /**
   * Send a message (queued if not connected)
   * @param message - Message to send
   */
  send(message: WebSocketMessage): void {
    const messageWithId = {
      ...message,
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || Date.now(),
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendImmediately(messageWithId);
    } else {
      this.messageQueue.push(messageWithId);
      
      // Limit queue size
      if (this.messageQueue.length > 100) {
        this.messageQueue.shift();
      }
    }
  }

  /**
   * Send a chat message
   * @param data - Chat message data
   */
  sendMessage(data: Omit<ChatMessage, 'type'>): void {
    this.send({
      type: 'message',
      ...data,
    });
  }

  /**
   * Send a notification
   * @param data - Notification data
   */
  sendNotification(data: Omit<NotificationMessage, 'type'>): void {
    this.send({
      type: 'notification',
      ...data,
    });
  }

  /**
   * Send status update
   * @param status - Status to send
   */
  sendStatus(status: 'online' | 'offline' | 'typing'): void {
    if (this.userId) {
      this.send({
        type: 'status',
        status,
        userId: this.userId,
      });
    }
  }

  /**
   * Register a message handler for a specific message type
   * @param messageType - Type of message to handle
   * @param handler - Handler function
   * @returns Cleanup function
   */
  onMessage(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    
    this.messageHandlers.get(messageType)!.add(handler);
    
    // Return cleanup function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType);
        }
      }
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: WebSocketMessage): void {
    // Handle heartbeat responses
    if (data.type === 'pong') {
      return;
    }

    this.notifyHandlers(data.type, data);
    this.notifyHandlers('*', data); // Global handler
  }

  /**
   * Notify handlers for a specific message type
   */
  private notifyHandlers(messageType: string, data: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionState = ConnectionState.ERROR;
      return;
    }

    this.connectionState = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;
    
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectInterval}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectInterval);

    // Exponential backoff with jitter
    this.reconnectInterval = Math.min(
      this.reconnectInterval * 2 + Math.random() * 1000,
      30000
    );
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendImmediately({
          type: 'ping',
          timestamp: Date.now(),
        });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendImmediately(message);
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

/**
 * React hook for WebSocket functionality
 */
export function useWebSocket(userId?: string, token?: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  // Connection effect
  useEffect(() => {
    if (userId) {
      websocketService.connect(userId, token);
      
      // Monitor connection state
      const updateState = () => {
        setConnectionState(websocketService.getConnectionState());
        setIsConnected(websocketService.isConnected());
        setQueueSize(websocketService.getQueueSize());
      };

      const interval = setInterval(updateState, 1000);
      updateState(); // Initial update

      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    }
  }, [userId, token]);

  // Cleanup handlers on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  const onMessage = useCallback((messageType: string, handler: MessageHandler) => {
    const cleanup = websocketService.onMessage(messageType, handler);
    cleanupFunctions.current.push(cleanup);
    return cleanup;
  }, []);

  const sendMessage = useCallback((data: Omit<ChatMessage, 'type'>) => {
    websocketService.sendMessage(data);
  }, []);

  const sendNotification = useCallback((data: Omit<NotificationMessage, 'type'>) => {
    websocketService.sendNotification(data);
  }, []);

  const sendStatus = useCallback((status: 'online' | 'offline' | 'typing') => {
    websocketService.sendStatus(status);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    websocketService.send(message);
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected,
    queueSize,
    
    // Methods
    send,
    sendMessage,
    sendNotification,
    sendStatus,
    onMessage,
    
    // Utility
    getUserId: () => websocketService.getUserId(),
  };
}

export default websocketService;
