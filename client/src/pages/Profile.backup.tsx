import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Grid, Bookmark, Settings, Heart, MessageCircle, MoreHorizontal, UserPlus, UserMinus } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import type { User, Post } from '@shared/schema';

export default function Profile() {
  const [, params] = useRoute('/profile/:username');
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const username = params?.username || currentUser?.username;
  const isOwnProfile = username === currentUser?.username;

  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
    retry: false,
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

  const { data: userPosts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${profileUser?.id}/posts`],
    enabled: !!profileUser?.id,
    retry: false,
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

  const { data: savedPosts, isLoading: savedLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${currentUser?.id}/saved`],
    enabled: isOwnProfile && !!currentUser?.id,
    retry: false,
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

  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: [`/api/users/${currentUser?.id}/following/${profileUser?.id}`],
    enabled: !isOwnProfile && !!currentUser?.id && !!profileUser?.id,
    retry: false,
  });

  const { data: followers } = useQuery<User[]>({
    queryKey: [`/api/users/${profileUser?.id}/followers`],
    enabled: !!profileUser?.id,
    retry: false,
  });

  const { data: following } = useQuery<User[]>({
    queryKey: [`/api/users/${profileUser?.id}/following`],
    enabled: !!profileUser?.id,
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const url = `/api/users/${profileUser?.id}/follow`;
      if (followStatus?.isFollowing) {
        await apiRequest(url, { method: 'DELETE' });
      } else {
        await apiRequest(url, { method: 'POST' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}/following/${profileUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUser?.id}/followers`] });
      toast({
        title: "Success",
        description: followStatus?.isFollowing ? "User unfollowed" : "User followed",
      });
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
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <Header />
        <div className="pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <Header />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h1>
            <p className="text-gray-600 dark:text-gray-400">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const posts = userPosts || [];
  const saved = savedPosts || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Header />

      <div className="pt-16 md:pt-20 pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={profileUser.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {profileUser.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {profileUser.username}
                </h1>

                {isOwnProfile ? (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      variant={followStatus?.isFollowing ? "outline" : "default"}
                      size="sm"
                      className={
                        followStatus?.isFollowing 
                          ? "border-gray-300 dark:border-gray-600"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }
                    >
                      {followStatus?.isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      Message
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex space-x-6 mb-4">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {profileUser.postCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">posts</div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-center hover:opacity-75">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {profileUser.followerCount || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">followers</div>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Followers</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {followers?.map((follower) => (
                        <div key={follower.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={follower.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {follower.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{follower.username}</div>
                            <div className="text-xs text-gray-500">
                              {follower.firstName && follower.lastName 
                                ? `${follower.firstName} ${follower.lastName}`
                                : follower.username
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-center hover:opacity-75">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {profileUser.followingCount || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">following</div>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Following</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {following?.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {user.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{user.username}</div>
                            <div className="text-xs text-gray-500">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.username
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <div className="text-gray-900 dark:text-white mb-4">
                  {profileUser.bio}
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="posts" className="flex items-center space-x-2">
                <Grid className="h-4 w-4" />
                <span className="hidden md:inline">Posts</span>
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="saved" className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden md:inline">Saved</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {postsLoading ? (
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-2xl mb-2">📷</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {isOwnProfile ? "Share your first photo" : "No posts yet"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isOwnProfile 
                      ? "When you share photos, they will appear on your profile."
                      : "When this user shares photos, they will appear here."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => {
                    const media = Array.isArray(post.media) ? post.media[0] : post.media;
                    return (
                      <div key={post.id} className="aspect-square relative group cursor-pointer">
                        <img
                          src={media}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-5 w-5" />
                              <span className="font-semibold">{post.likesCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-5 w-5" />
                              <span className="font-semibold">{post.commentsCount}</span>
                            </div>
                          </div>
                        </div>
                        {post.mediaType === 'carousel' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              <MoreHorizontal className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="saved" className="mt-6">
                {savedLoading ? (
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    ))}
                  </div>
                ) : saved.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-2xl mb-2">🔖</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Save photos and videos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Save posts to easily find them later.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {saved.map((post) => {
                      const media = Array.isArray(post.media) ? post.media[0] : post.media;
                      return (
                        <div key={post.id} className="aspect-square relative group cursor-pointer">
                          <img
                            src={media}
                            alt="Saved post"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                              <div className="flex items-center space-x-1">
                                <Heart className="h-5 w-5" />
                                <span className="font-semibold">{post.likesCount}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-5 w-5" />
                                <span className="font-semibold">{post.commentsCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <MobileNavigation
        onNavigateHome={() => window.location.href = '/'}
        onOpenSearch={() => console.log('Open search')}
        onOpenCreatePost={() => setShowCreateModal(true)}
        onNavigateReels={() => console.log('Navigate to reels')}
        onNavigateProfile={() => window.location.href = `/profile/${currentUser?.username}`}
      />
    </div>
  );
}
