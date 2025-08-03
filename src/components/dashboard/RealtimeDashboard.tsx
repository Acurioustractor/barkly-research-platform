'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, Zap, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle, Clock, Users, FileText, Activity, Bell,
  Wifi, WifiOff, Eye, BarChart3
} from 'lucide-react';
import { useRealtimeUpdates, RealtimeUpdate } from '@/lib/realtime-service';
import CommunityHealthIndicators from '@/components/intelligence/CommunityHealthIndicators';

interface DashboardStats {
  totalCommunities: number;
  thrivingCommunities: number;
  developingCommunities: number;
  strugglingCommunities: number;
  improvingCommunities: number;
  averageHealthScore: number;
  communitiesWithRecentData: number;
  lastCalculation: Date | null;
}

interface RecentActivity {
  id: string;
  type: 'document_processed' | 'status_change' | 'community_health' | 'service_update';
  title: string;
  description: string;
  communityName?: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
}

interface RealtimeDashboardProps {
  communityId?: string;
  refreshInterval?: number; // in seconds
  className?: string;
}

export default function RealtimeDashboard({ 
  communityId, 
  refreshInterval = 30,
  className = '' 
}: RealtimeDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time updates
  const { isConnected, lastUpdate, refresh } = useRealtimeUpdates(
    ['community_health', 'document_processed', 'status_change', 'service_update'],
    handleRealtimeUpdate,
    communityId
  );

  // Handle real-time updates
  function handleRealtimeUpdate(update: RealtimeUpdate) {
    console.log('Received real-time update:', update);
    
    // Add to recent activity
    const activity = createActivityFromUpdate(update);
    if (activity) {
      setRecentActivity(prev => [activity, ...prev.slice(0, 9)]); // Keep last 10
    }
    
    // Refresh stats if it's a significant update
    if (update.priority === 'high' || update.priority === 'critical' || 
        update.type === 'community_health') {
      loadDashboardStats();
    }
  }

  // Create activity item from update
  function createActivityFromUpdate(update: RealtimeUpdate): RecentActivity | null {
    const baseActivity = {
      id: `${update.type}_${Date.now()}_${Math.random()}`,
      timestamp: update.timestamp,
      priority: update.priority
    };

    switch (update.type) {
      case 'document_processed':
        return {
          ...baseActivity,
          type: 'document_processed',
          title: 'Document Processed',
          description: `"${update.data.title}" has been analyzed`,
          communityName: update.data.communityName,
          icon: <FileText className="w-4 h-4 text-blue-500" />
        };
      
      case 'status_change':
        return {
          ...baseActivity,
          type: 'status_change',
          title: 'Community Status Changed',
          description: `${update.data.name} status changed to ${update.data.status}`,
          communityName: update.data.name,
          icon: update.data.scoreChange > 0 ? 
            <TrendingUp className="w-4 h-4 text-green-500" /> :
            <TrendingDown className="w-4 h-4 text-red-500" />
        };
      
      case 'community_health':
        return {
          ...baseActivity,
          type: 'community_health',
          title: 'Health Data Updated',
          description: `Community health indicators refreshed`,
          icon: <Activity className="w-4 h-4 text-purple-500" />
        };
      
      default:
        return null;
    }
  }

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/intelligence/health-dashboard?type=summary');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalCommunities: data.data.total_communities || 0,
          thrivingCommunities: data.data.thriving_communities || 0,
          developingCommunities: data.data.developing_communities || 0,
          strugglingCommunities: data.data.struggling_communities || 0,
          improvingCommunities: data.data.improving_communities || 0,
          averageHealthScore: data.data.average_health_score || 0,
          communitiesWithRecentData: data.data.communities_with_recent_data || 0,
          lastCalculation: data.data.last_calculation ? new Date(data.data.last_calculation) : null
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadDashboardStats();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDashboardStats]);

  const handleManualRefresh = () => {
    setLoading(true);
    loadDashboardStats();
    refresh(); // Also trigger real-time service refresh
  };

  const getStatusColor = (status: string) => {
    const colors = {
      thriving: 'text-green-600 bg-green-50',
      developing: 'text-blue-600 bg-blue-50',
      improving: 'text-yellow-600 bg-yellow-50',
      struggling: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || colors.developing;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-gray-600 bg-gray-50'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading && !stats) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Community Intelligence Dashboard
          </h1>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Live updates active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span>Offline mode</span>
              </>
            )}
            {stats?.lastCalculation && (
              <span className="text-sm">
                • Last updated: {stats.lastCalculation.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Eye className={`w-4 h-4 ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            Auto-refresh
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Communities</p>
                  <p className="text-2xl font-bold">{stats.totalCommunities}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Health</p>
                  <p className="text-2xl font-bold">{Math.round(stats.averageHealthScore)}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={stats.averageHealthScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-red-600">{stats.strugglingCommunities}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Data</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.communitiesWithRecentData}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Community Status Distribution</CardTitle>
            <CardDescription>Current health status across all communities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.thrivingCommunities}</div>
                <Badge className={getStatusColor('thriving')}>Thriving</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.developingCommunities}</div>
                <Badge className={getStatusColor('developing')}>Developing</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.improvingCommunities}</div>
                <Badge className={getStatusColor('improving')}>Improving</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.strugglingCommunities}</div>
                <Badge className={getStatusColor('struggling')}>Struggling</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {communityId ? (
            <CommunityHealthIndicators 
              communityId={communityId} 
              showDetails={true}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Community Overview</CardTitle>
                <CardDescription>Select a community for detailed health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Choose a specific community to view detailed health metrics and insights
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Live updates and changes • {isConnected ? 'Connected' : 'Offline'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      {activity.communityName && (
                        <p className="text-xs text-blue-600 mt-1">{activity.communityName}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">Updates will appear here in real-time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}