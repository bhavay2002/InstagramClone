import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthContext } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface UserSuggestion extends User {
  isFollowing?: boolean;
}

export function RightSidebar() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery<UserSuggestion[]>({
    queryKey: [`/api/users/${user?.id}/suggestions`],
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/suggestions`] });
      toast({
        title: "Success",
        description: "Now following user",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleFollow = (userId: string) => {
    followMutation.mutate(userId);
  };

  return (
    <div className="sticky top-20 space-y-4">
      {/* Current User Mini Profile */}
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 font-semibold">
            Switch
          </Button>
        </div>
      </Card>

      {/* Suggestions For You */}
      {suggestions.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm">
              Suggestions For You
            </h3>
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-gray-900 dark:text-white">
              See All
            </Button>
          </div>
          <div className="space-y-3">
            {suggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.id} className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={suggestion.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {suggestion.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {suggestion.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Suggested for you
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFollow(suggestion.id)}
                  disabled={followMutation.isPending}
                  className="text-blue-500 hover:text-blue-600 font-semibold text-xs"
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Footer Links */}
      <Card className="p-4">
        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-2">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#" className="hover:underline">About</a>
            <span>·</span>
            <a href="#" className="hover:underline">Help</a>
            <span>·</span>
            <a href="#" className="hover:underline">Press</a>
            <span>·</span>
            <a href="#" className="hover:underline">API</a>
            <span>·</span>
            <a href="#" className="hover:underline">Jobs</a>
            <span>·</span>
            <a href="#" className="hover:underline">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#" className="hover:underline">Locations</a>
            <span>·</span>
            <a href="#" className="hover:underline">Language</a>
            <span>·</span>
            <a href="#" className="hover:underline">Meta Verified</a>
          </div>
          <div className="pt-2">
            <p>© 2025 INSTAGRAM CLONE</p>
          </div>
        </div>
      </Card>
    </div>
  );
}