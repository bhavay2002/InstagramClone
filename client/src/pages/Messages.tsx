import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Phone, Video, Info } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import type { User, Message } from '@shared/schema';
import { websocketService } from '@/services/websocket';

export default function Messages() {
  const [, params] = useRoute('/messages/:userId?');
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedUserId = params?.userId;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
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
  }, [currentUser, authLoading, toast]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUser?.id) {
      websocketService.connect(currentUser.id);
      
      // Listen for new messages
      websocketService.onMessage((data) => {
        if (data.type === 'new_message') {
          queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
          if (selectedUserId) {
            queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
          }
        }
      });

      return () => {
        websocketService.disconnect();
      };
    }
  }, [currentUser?.id, queryClient, selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId]);

  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery<{ user: User; lastMessage: Message }[]>({
    queryKey: ['/api/messages/conversations'],
    enabled: !!currentUser,
    retry: false,
  });

  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: !!selectedUserId && !!currentUser,
    retry: false,
  });

  const { data: selectedUser } = useQuery<User>({
    queryKey: [`/api/users/${selectedUserId}`],
    enabled: !!selectedUserId,
    retry: false,
  });

  const { data: searchResults, error: searchError } = useQuery<User[]>({
    queryKey: [`/api/users/search?q=${searchQuery}`],
    enabled: searchQuery.length > 0,
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        receiverId: selectedUserId,
        content,
        messageType: 'text'
      };
      
      const response = await apiRequest('POST', '/api/messages', messageData);
      const newMessage = await response.json();
      
      // Send real-time message via WebSocket
      websocketService.sendMessage({
        type: 'message',
        receiverId: selectedUserId,
        data: newMessage
      });
      
      return newMessage;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },

  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', `/api/messages/${selectedUserId}/read`);
    },
  });

  useEffect(() => {
    if (selectedUserId && currentUser) {
      markAsReadMutation.mutate();
    }
  }, [selectedUserId, currentUser]);

  // Error handling for queries
  React.useEffect(() => {
    if (conversationsError && conversationsError instanceof Error) {
      if (isUnauthorizedError(conversationsError)) {
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
    }
  }, [conversationsError, toast]);

  React.useEffect(() => {
    if (messagesError && messagesError instanceof Error) {
      if (isUnauthorizedError(messagesError)) {
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
    }
  }, [messagesError, toast]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedUserId) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleSelectConversation = (userId: string) => {
    window.location.href = `/messages/${userId}`;
  };

  const handleStartConversation = (user: User) => {
    setSearchQuery('');
    window.location.href = `/messages/${user.id}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <Header />
        <div className="pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Header />

      <div className="pt-16 md:pt-20 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
          <div className="flex h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            
            {/* Conversations List */}
            <div className={`${selectedUserId ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {currentUser?.username}
                </h2>
                <Input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <ScrollArea className="h-[calc(100vh-12rem)]">
                {searchQuery ? (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">Search Results</h3>
                    {searchResults?.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleStartConversation(user)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">Messages</h3>
                    {conversationsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-3 p-3">
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : conversations?.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-2xl mb-2">💬</div>
                        <p className="text-gray-600 dark:text-gray-400">
                          No conversations yet. Search for people to start chatting!
                        </p>
                      </div>
                    ) : (
                      conversations?.map(({ user, lastMessage }) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectConversation(user.id)}
                          className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer ${
                            selectedUserId === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {user.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {user.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(lastMessage.createdAt || new Date()), { addSuffix: false })}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {lastMessage.senderId === currentUser?.id ? 'You: ' : ''}{lastMessage.content}
                            </div>
                          </div>
                          {!lastMessage.isRead && lastMessage.senderId !== currentUser?.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`${selectedUserId ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
              {selectedUserId && selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/messages'}
                        className="md:hidden"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {selectedUser.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {selectedUser.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Info className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md h-8 rounded-2xl animate-pulse ${
                              i % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200 dark:bg-gray-700'
                            }`} />
                          </div>
                        ))}
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-2xl mb-2">👋</div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Start the conversation with {selectedUser.username}!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                message.senderId === currentUser?.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === currentUser?.id
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}>
                                {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Your Messages
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Send private photos and messages to a friend or group.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileNavigation
        onNavigateHome={() => window.location.href = '/'}
        onNavigateProfile={() => window.location.href = `/profile/${currentUser?.username}`}
      />
    </div>
  );
}
