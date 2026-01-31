'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription } from '@/components/core';
import { 
  WifiOff,
  RefreshCw,
  Database,
  FileText,
  Calendar,
  Users,
  BarChart3,
  Home,
  Clock,
  CheckCircle
} from 'lucide-react';
import { mobileOptimizationService } from '@/lib/community/mobile-optimization-service';
import MobileOptimizedLayout from '@/components/mobile/MobileOptimizedLayout';
import OfflineIndicator from '@/components/mobile/OfflineIndicator';

export default function OfflinePage() {
  const [cachedData, setCachedData] = useState<any>({
    stories: [],
    events: [],
    indicators: [],
    communities: []
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);

  useEffect(() => {
    loadCachedData();
    
    // Listen for online status changes
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const loadCachedData = () => {
    try {
      const stories = mobileOptimizationService.getCachedDataByType('story');
      const events = mobileOptimizationService.getCachedDataByType('event');
      const indicators = mobileOptimizationService.getCachedDataByType('indicator');
      const communities = mobileOptimizationService.getCachedDataByType('community');
      
      setCachedData({
        stories: stories.slice(0, 10), // Show latest 10
        events: events.slice(0, 5),    // Show latest 5
        indicators: indicators.slice(0, 8), // Show latest 8
        communities: communities.slice(0, 3) // Show latest 3
      });
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const handleOnline = () => {
    // Automatically redirect when back online
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const retryConnection = async () => {
    setIsRetrying(true);
    setLastAttempt(new Date());
    
    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        // Connection restored, redirect to main app
        window.location.href = '/';
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.log('Still offline:', error);
      // Stay on offline page
    } finally {
      setIsRetrying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <MobileOptimizedLayout currentPage="offline">
      <div className="space-y-6">
        {/* Offline Status Header */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <WifiOff className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-orange-800">
                    You're Offline
                  </h1>
                  <p className="text-orange-700">
                    No internet connection detected. You can still view cached content below.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={retryConnection}
                disabled={isRetrying}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Retry
              </Button>
            </div>
            
            {lastAttempt && (
              <div className="mt-4 text-sm text-orange-600">
                Last connection attempt: {lastAttempt.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Indicator */}
        <OfflineIndicator showDetails={true} />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Available Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/stories'}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">View Stories</span>
                <Badge variant="secondary" className="text-xs mt-1">
                  {cachedData.stories.length} cached
                </Badge>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/events'}
              >
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Events</span>
                <Badge variant="secondary" className="text-xs mt-1">
                  {cachedData.events.length} cached
                </Badge>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/community'}
              >
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Community</span>
                <Badge variant="secondary" className="text-xs mt-1">
                  {cachedData.communities.length} cached
                </Badge>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/insights'}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">Insights</span>
                <Badge variant="secondary" className="text-xs mt-1">
                  {cachedData.indicators.length} cached
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cached Stories */}
        {cachedData.stories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Stories
                </div>
                <Badge variant="outline">
                  {cachedData.stories.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cachedData.stories.map((story: any, index: number) => (
                  <div
                    key={story.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/stories/${story.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {story.data.title || 'Untitled Story'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {story.data.content?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {story.data.story_type || 'Story'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(story.data.created_at)}
                          </span>
                        </div>
                      </div>
                      <Database className="h-4 w-4 text-gray-400 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cached Events */}
        {cachedData.events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Events
                </div>
                <Badge variant="outline">
                  {cachedData.events.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cachedData.events.map((event: any, index: number) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/events/${event.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {event.data.title || 'Untitled Event'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.data.description?.substring(0, 80)}...
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.data.event_type || 'Event'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(event.data.start_date)} at {formatTime(event.data.start_date)}
                          </span>
                        </div>
                      </div>
                      <Database className="h-4 w-4 text-gray-400 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cached Indicators */}
        {cachedData.indicators.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Community Indicators
                </div>
                <Badge variant="outline">
                  {cachedData.indicators.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cachedData.indicators.map((indicator: any, index: number) => (
                  <div
                    key={indicator.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {indicator.data.indicator_name || 'Health Indicator'}
                      </h4>
                      <Database className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {indicator.data.current_value || 0}
                      </span>
                      <Badge 
                        variant={
                          indicator.data.trend === 'improving' ? 'default' :
                          indicator.data.trend === 'declining' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {indicator.data.trend || 'stable'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {formatDate(indicator.data.last_updated)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Cached Data */}
        {Object.values(cachedData).every((arr: any) => arr.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Cached Data Available</h3>
              <p className="text-gray-600 mb-4">
                You haven't visited the app while online yet, so there's no cached content to display.
              </p>
              <Button onClick={retryConnection} disabled={isRetrying}>
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Try to Connect
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offline Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Offline Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>View cached content:</strong> Browse stories, events, and community data that was previously loaded.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Create drafts:</strong> You can still create content drafts that will sync when you're back online.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Automatic sync:</strong> When your connection returns, all changes will automatically sync.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Install the app:</strong> Install as a PWA for better offline experience and faster loading.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status Footer */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            The app will automatically redirect you when your internet connection is restored.
            You can also tap "Retry" to check your connection manually.
          </AlertDescription>
        </Alert>
      </div>
    </MobileOptimizedLayout>
  );
}