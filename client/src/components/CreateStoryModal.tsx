import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CloudUpload, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStoryModal({ open, onOpenChange }: CreateStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStoryMutation = useMutation({
    mutationFn: async (storyData: any) => {
      await apiRequest('POST', '/api/stories', storyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/following'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stories`] });
      handleClose();
      toast({
        title: "Success",
        description: "Story created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      // In a real app, you'd upload to Cloudinary first
      // For now, we'll use a placeholder URL
      const mediaUrl = URL.createObjectURL(selectedFile);
      const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

      await createStoryMutation.mutateAsync({
        mediaUrl,
        mediaType,
      });
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full" aria-describedby="create-story-description">
        <div id="create-story-description" className="sr-only">
          Create a new story by uploading an image or video to share with your followers
        </div>
        <DialogHeader className="flex flex-row items-center justify-between p-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
          <DialogTitle className="text-lg font-semibold">Create story</DialogTitle>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || createStoryMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            {createStoryMutation.isPending ? 'Sharing...' : 'Share'}
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-900 dark:text-white mb-2">
                Add photo or video
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your story will be visible for 24 hours
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Select from computer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                {selectedFile.type.startsWith('video/') ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User info */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user?.username}
                </span>
              </div>

              {/* Change file button */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Change file
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}