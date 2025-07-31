import React, { useState, useCallback, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Play,
  Smile
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Post, User, Comment } from '@shared/schema';

interface EnhancedPostCardProps {
  post: Post & {
    user: User;
    hasLiked: boolean;
    hasSaved: boolean;
  };
  onOpenComments?: (postId: number) => void;
  onOpenProfile?: (username: string) => void;
}

export const EnhancedPostCard = memo(function EnhancedPostCard({ post, onOpenComments, onOpenProfile }: EnhancedPostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // Fetch recent comments
  const { data: comments = [] } = useQuery<(Comment & { user: User })[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: !!post.id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      if (!post.hasLiked) {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 600);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/posts/${post.id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const handleDoubleClick = () => {
    if (!post.hasLiked) {
      handleLike();
    }
  };

  const renderMedia = () => {
    const media = Array.isArray(post.media) ? post.media : [post.media];
    
    if (post.mediaType === 'video') {
      return (
        <div className="relative aspect-square bg-black">
          <div 
            className="w-full h-full bg-cover bg-center relative"
            style={{ backgroundImage: `url(${media[0]})` }}
            onDoubleClick={handleDoubleClick}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <Button
                size="lg"
                className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4"
              >
                <Play className="h-8 w-8 text-gray-800 ml-1" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              0:45
            </div>
          </div>
        </div>
      );
    }

    if (media.length === 1) {
      return (
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
          <img
            src={media[0]}
            alt="Post content"
            className="w-full h-full object-cover"
            onDoubleClick={handleDoubleClick}
          />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-20 w-20 text-red-500 fill-current animate-ping" />
            </div>
          )}
        </div>
      );
    }

    // Multiple images carousel
    return (
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="flex h-full">
          {media.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Post content ${index + 1}`}
              className="w-full h-full object-cover flex-shrink-0"
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
        {media.length > 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            1/{media.length}
          </div>
        )}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-20 w-20 text-red-500 fill-current animate-ping" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-8 w-8 cursor-pointer" 
            onClick={() => onOpenProfile?.(post.user.username)}
          >
            <AvatarImage src={post.user.profileImageUrl || undefined} />
            <AvatarFallback>
              {post.user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span 
              className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer hover:opacity-70"
              onClick={() => onOpenProfile?.(post.user.username)}
            >
              {post.user.username}
            </span>
            {post.location && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {post.location}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem>Unfollow</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Go to post</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Media */}
      {renderMedia()}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="p-0 h-auto hover:bg-transparent"
            >
              <Heart 
                className={`h-6 w-6 ${
                  post.hasLiked 
                    ? 'text-red-500 fill-current' 
                    : 'text-gray-900 dark:text-white hover:text-gray-600'
                }`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenComments?.(post.id)}
              className="p-0 h-auto hover:bg-transparent"
            >
              <MessageCircle className="h-6 w-6 text-gray-900 dark:text-white hover:text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:bg-transparent"
            >
              <Send className="h-6 w-6 text-gray-900 dark:text-white hover:text-gray-600" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="p-0 h-auto hover:bg-transparent"
          >
            <Bookmark 
              className={`h-6 w-6 ${
                post.hasSaved 
                  ? 'text-gray-900 dark:text-white fill-current' 
                  : 'text-gray-900 dark:text-white hover:text-gray-600'
              }`} 
            />
          </Button>
        </div>

        {/* Likes count */}
        {(post.likesCount || 0) > 0 && (
          <div className="mb-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {(post.likesCount || 0).toLocaleString()} {(post.likesCount || 0) === 1 ? 'like' : 'likes'}
            </span>
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <span className="text-sm text-gray-900 dark:text-white">
              <span 
                className="font-semibold cursor-pointer hover:opacity-70"
                onClick={() => onOpenProfile?.(post.user.username)}
              >
                {post.user.username}
              </span>{' '}
              {post.caption}
            </span>
          </div>
        )}

        {/* View comments link */}
        {comments.length > 0 && (
          <button
            onClick={() => onOpenComments?.(post.id)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:opacity-70 mb-2 block"
          >
            View all {comments.length} comments
          </button>
        )}

        {/* Recent comments preview */}
        {comments.slice(0, 2).map((comment) => (
          <div key={comment.id} className="mb-1">
            <span className="text-sm text-gray-900 dark:text-white">
              <span 
                className="font-semibold cursor-pointer hover:opacity-70"
                onClick={() => onOpenProfile?.(comment.user.username)}
              >
                {comment.user.username}
              </span>{' '}
              {comment.content}
            </span>
          </div>
        ))}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {formatDistanceToNow(new Date(post.createdAt || Date.now()), { addSuffix: true })}
        </div>

        {/* Add comment */}
        <form onSubmit={handleComment} className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:bg-transparent"
          >
            <Smile className="h-6 w-6 text-gray-400 hover:text-gray-600" />
          </Button>
          <Input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm placeholder:text-gray-500"
          />
          {commentText.trim() && (
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={commentMutation.isPending}
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm p-0 h-auto hover:bg-transparent"
            >
              Post
            </Button>
          )}
        </form>
      </div>
    </div>
  );
});