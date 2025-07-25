import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface AuthMessage {
  type: "auth";
  userId: string;
}

interface ChatMessage {
  type: "message";
  recipientId: string;
  content: string;
}

interface NotificationMessage {
  type: "notification";
  userId: string;
  content: string;
}

type IncomingMessage = AuthMessage | ChatMessage | NotificationMessage;

export const initWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const connectedUsers = new Map<string, WebSocket>();

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", (data: string) => {
      try {
        const message: IncomingMessage = JSON.parse(data);

        switch (message.type) {
          case "auth":
            if (typeof message.userId === "string") {
              userId = message.userId;
              connectedUsers.set(userId, ws);
              console.log(`[WebSocket] User ${userId} connected`);
            }
            break;

          case "message":
            if (userId && typeof message.recipientId === "string") {
              const recipient = connectedUsers.get(message.recipientId);
              if (recipient && recipient.readyState === WebSocket.OPEN) {
                recipient.send(
                  JSON.stringify({
                    type: "message",
                    senderId: userId,
                    content: message.content,
                    timestamp: Date.now(),
                  })
                );
              }
            }
            break;

          case "notification":
            if (typeof message.userId === "string") {
              const notificationRecipient = connectedUsers.get(message.userId);
              if (notificationRecipient && notificationRecipient.readyState === WebSocket.OPEN) {
                notificationRecipient.send(
                  JSON.stringify({
                    type: "notification",
                    content: message.content,
                    timestamp: Date.now(),
                  })
                );
              }
            }
            break;
        }
      } catch (err) {
        console.error("WebSocket Error:", err);
      }
    });

    ws.on("close", () => {
      if (userId) {
        connectedUsers.delete(userId);
        console.log(`[WebSocket] User ${userId} disconnected`);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket connection error:", error);
      if (userId) {
        connectedUsers.delete(userId);
      }
    });
  });

  return { wss, connectedUsers };
};
