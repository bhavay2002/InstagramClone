import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { PostCard } from '@/components/PostCard';
import { Sidebar } from '@/components/Sidebar';
import { CreatePostModal } from '@/components/CreatePostModal';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, User } from '@shared/schema';

interface FeedPost extends Post {
  user: User;
  hasLiked: boolean;
  hasSaved: boolean;
}

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const { data: feedPosts, isLoading } = useQuery<FeedPost[]>({
    queryKey: ['/api/posts/feed', offset],
    queryFn: async () => {
      const response = await fetch(`/api/posts/feed?offset=${offset}&limit=${limit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
  });

  // Handle data updates with useEffect instead of onSuccess
  React.useEffect(() => {
    if (feedPosts) {
      if (offset === 0) {
        setPosts(feedPosts);
      } else {
        setPosts(prev => [...prev, ...feedPosts]);
      }
    }
  }, [feedPosts, offset]);

  const hasNextPage = feedPosts && feedPosts.length === limit;

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleOpenComments = (postId: number) => {
    // TODO: Open comments modal/page
    console.log('Opening comments for post:', postId);
  };

  const handleOpenProfile = (username: string) => {
    // TODO: Navigate to profile page
    console.log('Opening profile:', username);
  };

  const renderSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-4 flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Header
        onNavigateHome={() => window.location.reload()}
        onNavigateMessages={() => console.log('Navigate to messages')}
        onNavigateExplore={() => console.log('Navigate to explore')}
        onNavigateProfile={() => console.log('Navigate to profile')}
        onOpenNotifications={() => console.log('Open notifications')}
      />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Instagram
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              <button className="p-2">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 md:pt-20 pb-16 md:pb-0">
        <div className="max-w-5xl mx-auto flex">
          <main className="flex-1 max-w-2xl mx-auto px-4">
            {/* Stories */}
            <StoriesCarousel
              onOpenStory={(userId, storyIndex) => console.log('Open story:', userId, storyIndex)}
              onCreateStory={() => console.log('Create story')}
            />

            {/* Feed */}
            {isLoading && offset === 0 ? (
              renderSkeleton()
            ) : (
              <InfiniteScroll
                hasMore={hasNextPage || false}
                isLoading={isLoading}
                onLoadMore={loadMore}
                className="space-y-6"
              >
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpenComments={handleOpenComments}
                    onOpenProfile={handleOpenProfile}
                  />
                ))}
                
                {isLoading && offset > 0 && renderSkeleton()}
              </InfiniteScroll>
            )}
          </main>

          <Sidebar
            onSwitchAccount={() => console.log('Switch account')}
            onSeeAllSuggestions={() => console.log('See all suggestions')}
          />
        </div>
      </div>

      <MobileNavigation
        onNavigateHome={() => window.location.reload()}
        onOpenSearch={() => console.log('Open search')}
        onOpenCreatePost={() => setShowCreateModal(true)}
        onNavigateReels={() => console.log('Navigate to reels')}
        onNavigateProfile={() => console.log('Navigate to profile')}
        onNavigateExplore={() => console.log('Navigate to explore')}
        onNavigateMessages={() => console.log('Navigate to messages')}
        onOpenNotifications={() => console.log('Open notifications')}
      />

      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
