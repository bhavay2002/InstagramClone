import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@shared/schema";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "Name is required"),
  lastName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(150, "Bio must be 150 characters or less").optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfilePageProps {
  isModal?: boolean;
  onClose?: () => void;
}

export default function EditProfilePage({ isModal = false, onClose }: EditProfilePageProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${(currentUser as User)?.username}`],
    enabled: !!(currentUser as User)?.username,
  });

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      phoneNumber: "",
      gender: undefined,
      website: "",
    },
  });

  // Reset form when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        phoneNumber: "",
        gender: undefined,
        website: "",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileFormData) => {
      return await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      const newUsername = form.getValues("username");
      
      // Invalidate both old and new username queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${(currentUser as User)?.username}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${newUsername}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (isModal && onClose) {
        onClose();
      } else {
        setLocation(`/profile/${newUsername}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/upload/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const result = await response.json();
      const imageUrl = result.urls?.[0];

      if (imageUrl) {
        // Update profile with new image
        await apiRequest("PUT", "/api/users/profile", {
          profileImageUrl: imageUrl,
        });

        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });

        queryClient.invalidateQueries({ queryKey: [`/api/users/${(currentUser as User)?.username}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
      setProfileImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = (data: EditProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      setLocation(`/profile/${(currentUser as User)?.username}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const content = (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {!isModal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Profile
          </h1>
        </div>
        {isModal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Profile Picture Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profileImagePreview || user?.profileImageUrl || ""}
                alt="Profile picture"
              />
              <AvatarFallback className="text-lg">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isUploadingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {user?.username}
            </h3>
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
            >
              Change profile photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              placeholder="Enter your first name"
              className="mt-1"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              placeholder="Enter your last name"
              className="mt-1"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            {...form.register("username")}
            placeholder="Enter your username"
            className="mt-1"
          />
          {form.formState.errors.username && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="Enter your email"
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            {...form.register("bio")}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={150}
            className="mt-1 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            {form.formState.errors.bio && (
              <p className="text-sm text-red-600">
                {form.formState.errors.bio.message}
              </p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {form.watch("bio")?.length || 0}/150
            </p>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            {...form.register("phoneNumber")}
            placeholder="Enter your phone number"
            className="mt-1"
          />
        </div>

        {/* Gender */}
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={form.watch("gender") || ""}
            onValueChange={(value) => form.setValue("gender", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            {...form.register("website")}
            placeholder="https://your-website.com"
            className="mt-1"
          />
          {form.formState.errors.website && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.website.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={updateProfileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="min-w-[120px]"
          >
            {updateProfileMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isModal && !isMobile) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {content}
    </div>
  );
}