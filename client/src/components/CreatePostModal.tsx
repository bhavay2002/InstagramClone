import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CloudUpload, MapPin, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export function CreatePostModal({ open, onOpenChange, onPostCreated }: CreatePostModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      await apiRequest('POST', '/api/posts', postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      handleClose();
      onPostCreated?.();
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCaption('');
    setLocation('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload files to Cloudinary
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { media } = await uploadResponse.json();
      const mediaUrls = media.map((item: any) => item.url);

      const postData = {
        caption: caption.trim() || null,
        location: location.trim() || null,
        media: mediaUrls,
        mediaType: selectedFiles[0].type.startsWith('video/') ? 'video' : mediaUrls.length > 1 ? 'carousel' : 'image'
      };

      createPostMutation.mutate(postData);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-hidden" aria-describedby="create-post-description">
        <div id="create-post-description" className="sr-only">
          Create a new post by uploading images, adding a caption, and sharing with your followers
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
          <DialogTitle className="text-lg font-semibold">Create new post</DialogTitle>
          <Button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || createPostMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            {createPostMutation.isPending ? 'Sharing...' : 'Share'}
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {selectedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-900 dark:text-white mb-2">
                Drag photos and videos here
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Select from computer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 border-none bg-transparent resize-none focus-visible:ring-0"
                  rows={3}
                  maxLength={2200}
                />
              </div>

              {/* Location */}
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 border-none bg-transparent focus-visible:ring-0"
                />
              </div>

              {/* Add More Files Button */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Add more files
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
