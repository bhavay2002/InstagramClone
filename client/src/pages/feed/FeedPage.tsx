import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedPostCard } from "@/components/EnhancedPostCard";
import { EnhancedStoriesCarousel } from "@/components/EnhancedStoriesCarousel";
import { CreatePostModal } from "@/components/CreatePostModal";
import { RightSidebar } from "@/components/RightSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle, Camera } from "lucide-react";
import { useLocation } from "wouter";
import type { Post, User } from "@shared/schema";

interface FeedPost extends Post {
  user: User;
  hasLiked: boolean;
  hasSaved: boolean;
}

export default function FeedPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: posts = [], isLoading, refetch } = useQuery<FeedPost[]>({
    queryKey: ["/api/posts/feed"],
    enabled: !!user,
  });

  const handlePostCreated = () => {
    refetch();
    setCreatePostOpen(false);
  };

  const handleNavigateHome = () => setLocation("/");
  const handleNavigateExplore = () => setLocation("/explore");
  const handleNavigateMessages = () => setLocation("/messages");
  const handleNavigateProfile = () => {
    if (user && typeof user === 'object' && user !== null && 'username' in user) {
      setLocation(`/profile/${(user as User).username}`);
    }
  };
  const handleOpenNotifications = () => setLocation("/notifications");
  const handleOpenSearch = () => setLocation("/explore");
  const handleNavigateReels = () => setLocation("/explore");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div>
        {/* Main container with Instagram-like layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Feed - Center Column */}
            <div className="lg:col-span-7 lg:col-start-3">
              <div className="max-w-[470px] mx-auto space-y-6 px-4 lg:px-0">
                {/* Stories Section */}
                <div className="mt-6">
                  <EnhancedStoriesCarousel 
                    onOpenStory={(userId, storyIndex) => {
                      console.log("Open story:", userId, storyIndex);
                    }}
                  />
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Share photos and videos
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6">
                            When you share photos and videos, they'll appear on your profile.
                          </p>
                          <Button
                            onClick={() => setCreatePostOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                          >
                            Share your first photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <EnhancedPostCard
                        key={post.id}
                        post={post}
                        onOpenComments={(postId) => {
                          console.log("Open comments for post:", postId);
                        }}
                        onOpenProfile={(username) => {
                          setLocation(`/profile/${username}`);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Desktop Only */}
            {!isMobile && (
              <div className="lg:col-span-3 lg:col-start-10">
                <RightSidebar />
              </div>
            )}
          </div>
        </div>
      </div>

      <CreatePostModal
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}