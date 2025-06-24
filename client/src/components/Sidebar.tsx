import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface SidebarProps {
  onSwitchAccount?: () => void;
  onSeeAllSuggestions?: () => void;
}

export function Sidebar({ onSwitchAccount, onSeeAllSuggestions }: SidebarProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions } = useQuery<User[]>({
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
        description: "User followed successfully",
      });
    },
    onError: (error) => {
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
    <aside className="hidden lg:block w-80 pl-8 py-6">
      <div className="sticky top-24 space-y-6">
        {/* User Profile Card */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900 dark:text-white">
              {user?.username}
            </div>
            <div className="text-sm text-gray-500">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.username
              }
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchAccount}
            className="text-xs font-semibold text-blue-500 hover:bg-transparent"
          >
            Switch
          </Button>
        </div>

        {/* Suggestions for You */}
        {suggestions && suggestions.length > 0 && (
          <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">
                Suggestions For You
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSeeAllSuggestions}
                className="text-xs font-semibold text-gray-900 dark:text-white hover:bg-transparent p-0"
              >
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
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {suggestion.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Suggested for you
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleFollow(suggestion.id)}
                    disabled={followMutation.isPending}
                    className="text-xs font-semibold text-blue-500 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 h-auto bg-transparent"
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer Links */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Help</a>
            <a href="#" className="hover:underline">Press</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">Jobs</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <div className="mt-4">© 2024 Instagram Clone</div>
        </div>
      </div>
    </aside>
  );
}
