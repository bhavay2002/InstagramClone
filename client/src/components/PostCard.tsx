import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Post, User } from '@shared/schema';

interface PostCardProps {
  post: Post & {
    user: User;
    hasLiked: boolean;
    hasSaved: boolean;
  };
  onOpenComments?: (postId: number) => void;
  onOpenProfile?: (username: string) => void;
}

export function PostCard({ post, onOpenComments, onOpenProfile }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onError: (error) => {
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
    onError: (error) => {
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
    onError: (error) => {
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

    return (
      <div className="relative">
        <img
          src={media[0]}
          alt="Post content"
          className="w-full aspect-square object-cover"
          onDoubleClick={handleDoubleClick}
        />
        {media.length > 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            1/{media.length}
          </div>
        )}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-16 w-16 text-red-500 fill-current animate-heart-beat" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.user.profileImageUrl || undefined} />
            <AvatarFallback>
              {post.user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              onClick={() => onOpenProfile?.(post.user.username || '')}
              className="font-semibold text-sm text-gray-900 dark:text-white hover:underline"
            >
              {post.user.username}
            </button>
            {post.location && (
              <span className="text-xs text-gray-500">{post.location}</span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="p-0 hover:bg-transparent"
            >
              <Heart
                className={`h-6 w-6 transition-colors ${
                  post.hasLiked ? 'text-red-500 fill-current' : 'text-gray-700 dark:text-gray-300'
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenComments?.(post.id)}
              className="p-0 hover:bg-transparent"
            >
              <MessageCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <Send className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="p-0 hover:bg-transparent"
          >
            <Bookmark
              className={`h-6 w-6 transition-colors ${
                post.hasSaved ? 'text-gray-900 dark:text-white fill-current' : 'text-gray-700 dark:text-gray-300'
              }`}
            />
          </Button>
        </div>

        {/* Likes */}
        <div className="mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {post.likesCount} likes
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
              {post.user.username}
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {post.caption}
            </span>
          </div>
        )}

        {/* Comments */}
        {(post.commentsCount ?? 0) > 0 && (
          <button
            onClick={() => onOpenComments?.(post.id)}
            className="text-sm text-gray-500 mb-2 hover:underline"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Time */}
        <div className="text-xs text-gray-500">
          {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
        </div>
      </div>

      {/* Add Comment */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleComment} className="flex items-center space-x-3">
          <Input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm placeholder:text-gray-500 focus-visible:ring-0"
          />
          {commentText.trim() && (
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-blue-500 font-semibold hover:bg-transparent"
              disabled={commentMutation.isPending}
            >
              Post
            </Button>
          )}
        </form>
      </div>
    </Card>
  );
}
