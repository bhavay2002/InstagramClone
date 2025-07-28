import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Grid, 
  Users, 
  Settings, 
  Heart, 
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  UserPlus,
  UserMinus
} from "lucide-react";
import type { User, Post } from "@shared/schema";

interface ProfilePost extends Post {
  user: User;
  hasLiked: boolean;
  hasSaved: boolean;
}

export default function ProfilePage() {
  const params = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  
  const username = params.username || currentUser?.username || "";
  const isOwnProfile = username === (currentUser?.username || "");

  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  // Handle user query error
  if (userError) {
    if (isUnauthorizedError(userError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    } else {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  }

  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery<ProfilePost[]>({
    queryKey: [`/api/users/${username}/posts`],
    enabled: !!username,
  });

  // Handle posts query error
  if (postsError && isUnauthorizedError(postsError)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const { data: followers = [] } = useQuery<User[]>({
    queryKey: [`/api/users/${username}/followers`],
    enabled: !!username,
  });

  const { data: following = [] } = useQuery<User[]>({
    queryKey: [`/api/users/${username}/following`],
    enabled: !!username,
  });

  const { data: savedPosts = [] } = useQuery<ProfilePost[]>({
    queryKey: [`/api/users/${username}/saved`],
    enabled: !!username && isOwnProfile,
  });

  const { data: isFollowing = false } = useQuery<boolean>({
    queryKey: [`/api/users/${username}/following-status`],
    enabled: !!username && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest(`/api/users/${username}/unfollow`, { method: "POST" });
      } else {
        await apiRequest(`/api/users/${username}/follow`, { method: "POST" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/following-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers`] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You ${isFollowing ? "unfollowed" : "are now following"} ${profileUser?.username || "this user"}`,
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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            The user you're looking for doesn't exist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32 mx-auto md:mx-0">
                <AvatarImage 
                  src={profileUser.profileImageUrl || ""} 
                  alt={profileUser.firstName || "User"} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {(profileUser.firstName?.[0] || profileUser.email?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileUser.firstName && profileUser.lastName 
                      ? `${profileUser.firstName} ${profileUser.lastName}`
                      : profileUser.email?.split('@')[0]
                    }
                  </h1>
                  
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                    {!isOwnProfile && (
                      <Button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        className={isFollowing ? "" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    
                    {isOwnProfile && (
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-8 mb-4">
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {posts.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Posts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {followers?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {following?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Following
                    </div>
                  </div>
                </div>

                {profileUser.username && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    @{profileUser.username}
                  </p>
                )}
                {profileUser.bio && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                    {profileUser.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center space-x-2">
              <Grid className="h-4 w-4" />
              <span>Posts</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4" />
                <span>Saved</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="followers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Followers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Grid className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "Share your first post!" : "No posts to show"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post: ProfilePost) => (
                  <Card key={post.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative">
                      {post.mediaType === "video" ? (
                        <video
                          src={post.media as string}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={post.media as string}
                          alt={post.caption || "Post"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center space-x-4 text-white">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-5 w-5" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-6">
              {savedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bookmark className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No saved posts
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Save posts you like to view them later
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative">
                        {post.mediaType === "video" ? (
                          <video
                            src={post.media as string}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={post.media as string}
                            alt={post.caption || "Post"}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black bg-opacity-50 text-white">
                            <Bookmark className="h-3 w-3" />
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="followers" className="mt-6">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No followers yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "Share great content to gain followers" : "This user has no followers yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers.map((follower) => (
                  <Card key={follower.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={follower.profileImageUrl || ""} alt={follower.firstName || "User"} />
                        <AvatarFallback>
                          {(follower.firstName?.[0] || follower.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {follower.firstName && follower.lastName 
                            ? `${follower.firstName} ${follower.lastName}`
                            : follower.email?.split('@')[0]
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {follower.email}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}