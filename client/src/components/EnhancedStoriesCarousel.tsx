import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { CreateStoryModal } from './CreateStoryModal';
import type { Story, User } from '@shared/schema';

interface StoryUser extends User {
  stories: Story[];
  hasUnviewedStories: boolean;
}

interface EnhancedStoriesCarouselProps {
  onOpenStory?: (userId: string, storyIndex: number) => void;
}

export function EnhancedStoriesCarousel({ onOpenStory }: EnhancedStoriesCarouselProps) {
  const { user } = useAuthContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const { data: followingStories = [] } = useQuery<StoryUser[]>({
    queryKey: ['/api/stories/following'],
    enabled: !!user,
  });

  const { data: userStories = [] } = useQuery<Story[]>({
    queryKey: [`/api/users/${user?.id}/stories`],
    enabled: !!user,
  });

  const scrollLeft = () => {
    const container = document.getElementById('stories-container');
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('stories-container');
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {/* Scroll buttons for desktop */}
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-lg rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollRight}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-lg rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div
          id="stories-container"
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Your Story */}
          <div className="flex flex-col items-center space-y-2 flex-shrink-0">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-0.5">
                <Avatar className="h-full w-full border-2 border-white dark:border-gray-900">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600 p-0 border-2 border-white dark:border-gray-900"
              >
                <Plus className="h-3 w-3 text-white" />
              </Button>
            </div>
            <span className="text-xs text-gray-900 dark:text-white text-center font-medium max-w-16 truncate">
              Your Story
            </span>
          </div>

          {/* Following Stories */}
          {followingStories.map((storyUser) => (
            <div
              key={storyUser.id}
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer"
              onClick={() => onOpenStory?.(storyUser.id, 0)}
            >
              <div className="relative">
                <div className={`h-16 w-16 rounded-full p-0.5 ${
                  storyUser.hasUnviewedStories
                    ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
                    : 'bg-gradient-to-tr from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                }`}>
                  <Avatar className="h-full w-full border-2 border-white dark:border-gray-900">
                    <AvatarImage src={storyUser.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                      {storyUser.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-gray-900 dark:text-white text-center max-w-16 truncate">
                {storyUser.username}
              </span>
            </div>
          ))}

          {/* Empty state for no stories */}
          {followingStories.length === 0 && (
            <div className="flex items-center justify-center h-16 px-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Follow people to see their stories
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateStoryModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}