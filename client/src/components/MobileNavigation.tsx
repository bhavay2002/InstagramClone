import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Search, PlusSquare, Play } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface MobileNavigationProps {
  onNavigateHome?: () => void;
  onOpenSearch?: () => void;
  onOpenCreatePost?: () => void;
  onNavigateReels?: () => void;
  onNavigateProfile?: () => void;
}

export function MobileNavigation({
  onNavigateHome,
  onOpenSearch,
  onOpenCreatePost,
  onNavigateReels,
  onNavigateProfile,
}: MobileNavigationProps) {
  const { user } = useAuthContext();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          className="p-3"
        >
          <Home className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSearch}
          className="p-3"
        >
          <Search className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCreatePost}
          className="p-3"
        >
          <PlusSquare className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateReels}
          className="p-3"
        >
          <Play className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateProfile}
          className="p-2 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </nav>
  );
}
