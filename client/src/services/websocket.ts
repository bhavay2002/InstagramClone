import React from 'react';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type MessageHandler = (data: WebSocketMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        
        // Authenticate user
        this.send({
          type: 'auth',
          userId: userId,
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers = [];
    this.userId = null;
  }

  send(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  sendMessage(data: any) {
    this.send({
      type: 'message',
      ...data,
    });
  }

  sendNotification(data: any) {
    this.send({
      type: 'notification',
      ...data,
    });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
    
    // Return cleanup function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  private handleMessage(data: WebSocketMessage) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectInterval}ms`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectInterval);

    // Exponential backoff
    this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000);
  }

  getConnectionState(): string {
    if (!this.socket) return 'DISCONNECTED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Hook for React components
export function useWebSocket(userId?: string) {
  const [connectionState, setConnectionState] = React.useState('DISCONNECTED');

  React.useEffect(() => {
    if (userId) {
      websocketService.connect(userId);
      
      const interval = setInterval(() => {
        setConnectionState(websocketService.getConnectionState());
      }, 1000);

      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    }
  }, [userId]);

  return {
    send: websocketService.send.bind(websocketService),
    sendMessage: websocketService.sendMessage.bind(websocketService),
    sendNotification: websocketService.sendNotification.bind(websocketService),
    onMessage: websocketService.onMessage.bind(websocketService),
    isConnected: websocketService.isConnected.bind(websocketService),
    connectionState,
  };
}

export default websocketService;
