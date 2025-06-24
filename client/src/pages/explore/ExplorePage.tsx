import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  TrendingUp, 
  Users, 
  Hash, 
  MapPin, 
  Heart,
  MessageCircle,
  Compass
} from "lucide-react";
import type { Post, User } from "@shared/schema";

interface ExplorePost extends Post {
  user: User;
  hasLiked: boolean;
  hasSaved: boolean;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch trending posts
  const { data: trendingPosts = [], isLoading: postsLoading } = useQuery<ExplorePost[]>({
    queryKey: ["/api/posts/trending"],
    enabled: !!user,
  });

  // Fetch suggested users
  const { data: suggestedUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [`/api/users/${user?.id}/suggestions`],
    enabled: !!user,
  });

  // Search results
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: [`/api/users/search?q=${searchQuery}`],
    enabled: searchQuery.length > 0,
  });

  const trendingHashtags = [
    { tag: "photography", count: "2.1M" },
    { tag: "travel", count: "1.8M" },
    { tag: "food", count: "1.5M" },
    { tag: "nature", count: "1.2M" },
    { tag: "art", count: "980K" },
    { tag: "fitness", count: "850K" },
    { tag: "technology", count: "720K" },
    { tag: "lifestyle", count: "650K" },
  ];

  const trendingLocations = [
    { location: "New York, NY", count: "1.2M" },
    { location: "Los Angeles, CA", count: "980K" },
    { location: "London, UK", count: "850K" },
    { location: "Tokyo, Japan", count: "720K" },
    { location: "Paris, France", count: "650K" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Explore
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users, hashtags, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No users found for "{searchQuery}"
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={searchUser.profileImageUrl || ""} alt={searchUser.firstName || "User"} />
                          <AvatarFallback>
                            {(searchUser.firstName?.[0] || searchUser.email?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {searchUser.firstName && searchUser.lastName 
                              ? `${searchUser.firstName} ${searchUser.lastName}`
                              : searchUser.email?.split('@')[0]
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {searchUser.email}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Explore Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>People</span>
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Hashtags</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Places</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                      </div>
                    </div>
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trendingPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No trending posts
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Check back later for trending content
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                    <div className="aspect-square relative">
                      {post.mediaType === "video" ? (
                        <video
                          src={post.media as string}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={post.media as string}
                          alt={post.caption || "Post"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center space-x-4 text-white">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-5 w-5" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user.profileImageUrl || ""} alt={post.user.firstName || "User"} />
                          <AvatarFallback className="text-xs">
                            {(post.user.firstName?.[0] || post.user.email?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {post.user.firstName && post.user.lastName 
                              ? `${post.user.firstName} ${post.user.lastName}`
                              : post.user.email?.split('@')[0]
                            }
                          </div>
                        </div>
                      </div>
                      {post.caption && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {post.caption}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            {usersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="space-y-2 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedUsers.map((suggestedUser) => (
                  <Card key={suggestedUser.id} className="p-6">
                    <div className="text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarImage src={suggestedUser.profileImageUrl || ""} alt={suggestedUser.firstName || "User"} />
                        <AvatarFallback className="text-lg">
                          {(suggestedUser.firstName?.[0] || suggestedUser.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mb-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {suggestedUser.firstName && suggestedUser.lastName 
                            ? `${suggestedUser.firstName} ${suggestedUser.lastName}`
                            : suggestedUser.email?.split('@')[0]
                          }
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {suggestedUser.email}
                        </div>
                      </div>
                      <Button className="w-full">
                        Follow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingHashtags.map((hashtag) => (
                <Card key={hashtag.tag} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                      <Hash className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        #{hashtag.tag}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hashtag.count} posts
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Trending
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingLocations.map((location) => (
                <Card key={location.location} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {location.location}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.count} posts
                      </div>
                    </div>
                    <Badge variant="outline">
                      Popular
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}