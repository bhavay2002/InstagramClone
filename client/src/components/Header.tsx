import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Search, PlusSquare, Compass, Heart, MessageCircle, User, Settings, LogOut } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { CreatePostModal } from './CreatePostModal';

interface HeaderProps {
  onNavigateHome?: () => void;
  onNavigateExplore?: () => void;
  onNavigateMessages?: () => void;
  onNavigateProfile?: () => void;
  onOpenNotifications?: () => void;
}

export function Header({
  onNavigateHome,
  onNavigateExplore,
  onNavigateMessages,
  onNavigateProfile,
  onOpenNotifications,
}: HeaderProps) {
  const { user } = useAuthContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <>
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateHome}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent"
              >
                Instagram Clone
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateHome}
                className="p-2"
              >
                <Home className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateMessages}
                className="p-2"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="p-2"
              >
                <PlusSquare className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateExplore}
                className="p-2"
              >
                <Compass className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenNotifications}
                className="p-2"
              >
                <Heart className="h-6 w-6" />
              </Button>
              
              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={onNavigateProfile}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}
