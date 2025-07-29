import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Search, PlusSquare, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MobileNavigationProps {
  onNavigateHome?: () => void;
  onNavigateExplore?: () => void;
  onNavigateMessages?: () => void;
  onNavigateProfile?: () => void;
  onOpenNotifications?: () => void;
  onOpenCreatePost?: () => void;
}

export function MobileNavigation({
  onNavigateHome,
  onNavigateExplore,
  onNavigateMessages,
  onNavigateProfile,
  onOpenNotifications,
  onOpenCreatePost,
}: MobileNavigationProps) {
  const { user } = useAuth();

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
          onClick={onNavigateExplore}
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
          onClick={onNavigateMessages}
          className="p-3"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenNotifications}
          className="p-3"
        >
          <Heart className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateProfile}
          className="p-2 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
            <AvatarFallback>
              {(user as any)?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </nav>
  );
}
