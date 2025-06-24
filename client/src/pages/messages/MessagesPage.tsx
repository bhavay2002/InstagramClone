import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Send, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreHorizontal,
  ArrowLeft
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User, Message } from "@shared/schema";

interface ConversationItem {
  user: User;
  lastMessage: Message;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationItem[]>({
    queryKey: ["/api/messages/conversations"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedConversation?.id}`],
    enabled: !!selectedConversation,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Search users
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: [`/api/users/search?q=${searchQuery}`],
    enabled: searchQuery.length > 0,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          receiverId,
          content,
        }),
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries([`/api/messages/${selectedConversation?.id}`]);
      queryClient.invalidateQueries(["/api/messages/conversations"]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // WebSocket setup
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries([`/api/messages/${data.senderId}`]);
        queryClient.invalidateQueries(["/api/messages/conversations"]);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    // Send via WebSocket for real-time delivery
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        receiverId: selectedConversation.id,
        content: messageText.trim()
      }));
    }

    // Also send via API for persistence
    sendMessageMutation.mutate({
      receiverId: selectedConversation.id,
      content: messageText.trim(),
    });
  };

  const handleStartConversation = (user: User) => {
    setSelectedConversation(user);
    setSearchQuery("");
  };

  const formatMessageTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Mobile layout: show conversation list or chat
  if (isMobile) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        {!selectedConversation ? (
          // Conversation List (Mobile)
          <div className="h-full flex flex-col">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchQuery ? (
                // Search Results
                <div className="p-4 space-y-2">
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      onClick={() => handleStartConversation(searchUser)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                    >
                      <Avatar>
                        <AvatarImage src={searchUser.profileImageUrl || ""} alt={searchUser.firstName || "User"} />
                        <AvatarFallback>
                          {(searchUser.firstName?.[0] || searchUser.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {searchUser.firstName && searchUser.lastName 
                            ? `${searchUser.firstName} ${searchUser.lastName}`
                            : searchUser.email?.split('@')[0]
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Start a conversation
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Conversations List
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map(({ user: conversationUser, lastMessage }) => (
                    <div
                      key={conversationUser.id}
                      onClick={() => setSelectedConversation(conversationUser)}
                      className="flex items-center space-x-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Avatar>
                        <AvatarImage src={conversationUser.profileImageUrl || ""} alt={conversationUser.firstName || "User"} />
                        <AvatarFallback>
                          {(conversationUser.firstName?.[0] || conversationUser.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {conversationUser.firstName && conversationUser.lastName 
                              ? `${conversationUser.firstName} ${conversationUser.lastName}`
                              : conversationUser.email?.split('@')[0]
                            }
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMessageTime(lastMessage.createdAt || new Date())}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {lastMessage.content}
                        </div>
                      </div>
                      {!lastMessage.isRead && lastMessage.senderId !== user?.id && (
                        <Badge className="bg-blue-500">New</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Chat View (Mobile)
          <div className="h-full flex flex-col">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedConversation.profileImageUrl || ""} alt={selectedConversation.firstName || "User"} />
                  <AvatarFallback>
                    {(selectedConversation.firstName?.[0] || selectedConversation.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedConversation.firstName && selectedConversation.lastName 
                      ? `${selectedConversation.firstName} ${selectedConversation.lastName}`
                      : selectedConversation.email?.split('@')[0]
                    }
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Online</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      <div>{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatMessageTime(message.createdAt || new Date())}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto h-full">
        <div className="grid grid-cols-3 h-full">
          {/* Conversations Sidebar */}
          <Card className="rounded-none border-r border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Messages</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {searchQuery ? (
                  // Search Results
                  <div className="p-4 space-y-2">
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        onClick={() => handleStartConversation(searchUser)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                      >
                        <Avatar>
                          <AvatarImage src={searchUser.profileImageUrl || ""} alt={searchUser.firstName || "User"} />
                          <AvatarFallback>
                            {(searchUser.firstName?.[0] || searchUser.email?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {searchUser.firstName && searchUser.lastName 
                              ? `${searchUser.firstName} ${searchUser.lastName}`
                              : searchUser.email?.split('@')[0]
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Start a conversation
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Conversations List
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {conversations.map(({ user: conversationUser, lastMessage }) => (
                      <div
                        key={conversationUser.id}
                        onClick={() => setSelectedConversation(conversationUser)}
                        className={`flex items-center space-x-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedConversation?.id === conversationUser.id 
                            ? "bg-gray-100 dark:bg-gray-700" 
                            : ""
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conversationUser.profileImageUrl || ""} alt={conversationUser.firstName || "User"} />
                          <AvatarFallback>
                            {(conversationUser.firstName?.[0] || conversationUser.email?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {conversationUser.firstName && conversationUser.lastName 
                                ? `${conversationUser.firstName} ${conversationUser.lastName}`
                                : conversationUser.email?.split('@')[0]
                              }
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatMessageTime(lastMessage.createdAt || new Date())}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {lastMessage.content}
                          </div>
                        </div>
                        {!lastMessage.isRead && lastMessage.senderId !== user?.id && (
                          <Badge className="bg-blue-500">New</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <div className="col-span-2">
            {selectedConversation ? (
              <Card className="h-full rounded-none flex flex-col">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={selectedConversation.profileImageUrl || ""} alt={selectedConversation.firstName || "User"} />
                        <AvatarFallback>
                          {(selectedConversation.firstName?.[0] || selectedConversation.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedConversation.firstName && selectedConversation.lastName 
                            ? `${selectedConversation.firstName} ${selectedConversation.lastName}`
                            : selectedConversation.email?.split('@')[0]
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Online</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                            }`}
                          >
                            <div>{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {formatMessageTime(message.createdAt || new Date())}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose from your existing conversations or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}