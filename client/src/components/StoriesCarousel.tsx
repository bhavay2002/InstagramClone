import React, { useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import type { Story, User } from '@shared/schema';

interface StoriesCarouselProps {
  onOpenStory?: (userId: string, storyIndex: number) => void;
  onCreateStory?: () => void;
}

export const StoriesCarousel = memo(function StoriesCarousel({ onOpenStory, onCreateStory }: StoriesCarouselProps) {
  const { user } = useAuthContext();

  const { data: followingStories } = useQuery<{ user: User; stories: Story[] }[]>({
    queryKey: ['/api/stories/following'],
    enabled: !!user,
  });

  const { data: userStories } = useQuery<Story[]>({
    queryKey: [`/api/users/${user?.id}/stories`],
    enabled: !!user,
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Your Story */}
        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {(!userStories || userStories.length === 0) && (
              <Button
                size="sm"
                onClick={onCreateStory}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600 p-0"
              >
                <Plus className="h-3 w-3 text-white" />
              </Button>
            )}
          </div>
          <span className="text-xs text-gray-900 dark:text-white text-center">
            Your Story
          </span>
        </div>

        {/* Following Stories */}
        {followingStories?.map(({ user: storyUser, stories }) => (
          <div
            key={storyUser.id}
            className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer"
            onClick={() => onOpenStory?.(storyUser.id, 0)}
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
                <Avatar className="h-full w-full border-2 border-white dark:border-gray-900">
                  <AvatarImage src={storyUser.profileImageUrl || undefined} />
                  <AvatarFallback>
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
      </div>
    </Card>
  );
});
