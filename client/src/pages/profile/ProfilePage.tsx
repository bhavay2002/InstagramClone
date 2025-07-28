import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/PostCard";
import { 
  Grid, 
  Film,
  Settings, 
  Heart, 
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Camera,
  Share,
  ChevronDown,
  UserCheck,
  Play,
  Users
} from "lucide-react";
import type { User, Post } from "@shared/schema";
import EditProfilePage from "./EditProfilePage"

interface ProfilePost extends Post {
  user: User;
  hasLiked: boolean;
  hasSaved: boolean;
}

export default function ProfilePage() {
  const params = useParams<{ username?: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("posts");
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const username = params?.username || (currentUser as User)?.username;
  const isOwnProfile = username === (currentUser as User)?.username;

  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  // Handle errors in useEffect instead of onError
  React.useEffect(() => {
    if (userError && userError instanceof Error) {
      if (isUnauthorizedError(userError)) {
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
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  }, [userError, toast]);

  const { data: posts = [], isLoading: postsLoading } = useQuery<ProfilePost[]>({
    queryKey: [`/api/users/${username}/posts`],
    enabled: !!username,
  });

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
      const method = isFollowing ? "DELETE" : "POST";
      return await apiRequest(method, `/api/users/${username}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/following-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers`] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You ${isFollowing ? "unfollowed" : "are now following"} ${profileUser?.firstName || "this user"}`,
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/feed')}
              className="p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">{profileUser?.username || username}</h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Profile Header - Instagram Style */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <Avatar className="w-20 h-20 md:w-36 md:h-36 ring-1 ring-gray-300 dark:ring-gray-600">
                  <AvatarImage 
                    src={profileUser.profileImageUrl || ""} 
                    alt={profileUser.username || "User"} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl md:text-4xl bg-gray-100 dark:bg-gray-800">
                    {(profileUser.username?.[0] || profileUser.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-black border-2 border-white dark:border-black shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Username and Actions Row */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-light text-gray-900 dark:text-white mb-2 md:mb-0">
                  {profileUser.username || profileUser.email?.split('@')[0]}
                </h1>
                
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  {!isOwnProfile ? (
                    <>
                      <Button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        size="sm"
                        className={`px-6 ${
                          isFollowing 
                            ? "bg-gray-200 hover:bg-gray-300 text-black border border-gray-300" 
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-6 border-gray-300 dark:border-gray-600"
                      >
                        Message
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-6 border-gray-300 dark:border-gray-600"
                      onClick={() => setShowEditProfile(true)}
                    >
                      Edit profile
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center md:text-left">
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">
                    {posts.length}
                  </span>
                  <span className="text-gray-900 dark:text-white ml-1">posts</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">
                    {profileUser.followerCount || followers.length}
                  </span>
                  <span className="text-gray-900 dark:text-white ml-1">followers</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">
                    {profileUser.followingCount || following.length}
                  </span>
                  <span className="text-gray-900 dark:text-white ml-1">following</span>
                </div>
              </div>

              {/* Bio Section */}
              <div className="text-left max-w-md mx-auto md:mx-0">
                {(profileUser.firstName || profileUser.lastName) && (
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {`${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim()}
                  </div>
                )}
                {profileUser.bio && (
                  <div className="text-gray-900 dark:text-white text-sm mb-2">
                    {profileUser.bio}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instagram-style Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-center">
            <div className="flex space-x-12 md:space-x-16">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex items-center space-x-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                  activeTab === "posts"
                    ? "border-t-2 border-black dark:border-white text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Grid className="h-4 w-4" />
                <span>Posts</span>
              </button>
              
              <button
                onClick={() => setActiveTab("reels")}
                className={`flex items-center space-x-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                  activeTab === "reels"
                    ? "border-t-2 border-black dark:border-white text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Reels</span>
              </button>

              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab("saved")}
                  className={`flex items-center space-x-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                    activeTab === "saved"
                      ? "border-t-2 border-black dark:border-white text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Saved</span>
                </button>
              )}
              
              <button
                onClick={() => setActiveTab("tagged")}
                className={`flex items-center space-x-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                  activeTab === "tagged"
                    ? "border-t-2 border-black dark:border-white text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Tagged</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div>
              {postsLoading ? (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-2 border-black dark:border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                    Share Photos
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    When you share photos, they will appear on your profile.
                  </p>
                  {isOwnProfile && (
                    <Button className="mt-4 text-blue-500 hover:text-blue-600" variant="link">
                      Share your first photo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {posts.map((post) => (
                    <Dialog key={post.id}>
                      <DialogTrigger asChild>
                        <div className="aspect-square relative group cursor-pointer">
                          {post.mediaType === "video" ? (
                            <div className="relative w-full h-full">
                              <video
                                src={Array.isArray(post.media) ? post.media[0] : post.media}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute top-2 right-2">
                                <Play className="h-4 w-4 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={Array.isArray(post.media) ? post.media[0] : post.media}
                              alt={post.caption || "Post"}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Multiple images indicator */}
                          {Array.isArray(post.media) && post.media.length > 1 && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-black bg-opacity-60 rounded-full p-1">
                                <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex items-center space-x-6 text-white">
                              <div className="flex items-center space-x-2">
                                <Heart className="h-6 w-6 fill-white" />
                                <span className="font-semibold">{post.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MessageCircle className="h-6 w-6 fill-white" />
                                <span className="font-semibold">{post.commentsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <PostCard post={post} />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reels Tab */}
          {activeTab === "reels" && (
            <div>
              {posts.filter(p => p.mediaType === "video").length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-2 border-black dark:border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Film className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                    Share Reels
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    When you share reels, they will appear on your profile.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {posts.filter(p => p.mediaType === "video").map((post) => (
                    <Dialog key={post.id}>
                      <DialogTrigger asChild>
                        <div className="aspect-[9/16] relative group cursor-pointer">
                          <video
                            src={Array.isArray(post.media) ? post.media[0] : post.media}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute bottom-2 left-2">
                            <Play className="h-4 w-4 text-white drop-shadow-lg" />
                          </div>
                          <div className="absolute bottom-2 right-2 text-white text-xs font-semibold drop-shadow-lg">
                            {post.likesCount || 0}
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <PostCard post={post} />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Tab (Only for own profile) */}
          {activeTab === "saved" && isOwnProfile && (
            <div>
              {savedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-2 border-black dark:border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                    Save
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Save photos and videos that you want to see again.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {savedPosts.map((post) => (
                    <Dialog key={post.id}>
                      <DialogTrigger asChild>
                        <div className="aspect-square relative group cursor-pointer">
                          {post.mediaType === "video" ? (
                            <video
                              src={Array.isArray(post.media) ? post.media[0] : post.media}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={Array.isArray(post.media) ? post.media[0] : post.media}
                              alt={post.caption || "Post"}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <PostCard post={post} />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tagged Tab */}
          {activeTab === "tagged" && (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-2 border-black dark:border-white rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                Photos of you
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                When people tag you in photos, they'll appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal/Page */}
      {showEditProfile && (
        <EditProfilePage
          isModal={!isMobile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}