import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share, Users, Camera, Zap } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Instagram Clone
          </div>
          <Button onClick={handleLogin} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Log In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Share Your World
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with friends, share moments, and discover amazing content from around the globe.
            Join our vibrant community today.
          </p>
          <Button 
            size="lg"
            onClick={handleLogin}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 rounded-full"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-none shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <CardTitle>Share Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Capture and share your favorite moments with beautiful photos and videos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Follow friends, discover new people, and build meaningful connections.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <CardTitle>Real-time</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Stay updated with real-time notifications and instant messaging.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Express Yourself
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Like and interact with posts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Comment and engage in conversations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Share className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Share content with your network</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-80 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-2xl flex items-center justify-center">
              <div className="text-6xl">📱</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start sharing your story with the world today.
          </p>
          <Button 
            size="lg"
            onClick={handleLogin}
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full"
          >
            Create Account
          </Button>
        </div>
      </main>
    </div>
  );
}
