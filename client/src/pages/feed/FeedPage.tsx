import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { PostCard } from "@/components/PostCard";
import { StoriesCarousel } from "@/components/StoriesCarousel";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Header } from "@/components/Header";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onNavigateHome={handleNavigateHome}
        onNavigateExplore={handleNavigateExplore}
        onNavigateMessages={handleNavigateMessages}
        onNavigateProfile={handleNavigateProfile}
        onOpenNotifications={handleOpenNotifications}
      />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Instagram Clone
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2" onClick={handleOpenNotifications}>
                <Heart className="h-6 w-6" />
              </button>
              <button className="p-2" onClick={handleNavigateMessages}>
                <MessageCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 md:pt-20 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <StoriesCarousel />
            </div>

            {/* Create Post Button (Mobile) */}
            {isMobile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setCreatePostOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <Heart className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No posts yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Follow some users to see their posts in your feed
                      </p>
                      <Button
                        onClick={() => setCreatePostOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Post
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpenComments={(postId) => {
                      // Handle open comments
                      console.log("Open comments for post:", postId);
                    }}
                    onOpenProfile={(username) => {
                      // Handle open profile
                      console.log("Open profile:", username);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                <Sidebar />
                
                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setCreatePostOpen(true)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <MobileNavigation
        onNavigateHome={handleNavigateHome}
        onOpenSearch={handleOpenSearch}
        onOpenCreatePost={() => setCreatePostOpen(true)}
        onNavigateReels={handleNavigateReels}
        onNavigateProfile={handleNavigateProfile}
      />

      <CreatePostModal
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}