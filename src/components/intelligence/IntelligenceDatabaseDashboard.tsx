'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  BarChart3,
  Activity,
  Shield,
  Eye
} from 'lucide-react';

interface IntelligenceInsight {
  id: string;
  community_id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  urgency_level: string;
  impact_level: string;
  validation_status: string;
  cultural_review_status: string;
  created_at: string;
  tags: string[];
}

interface CommunityIntelligenceSummary {
  community_id: string;
  community_name: string;
  total_insights: number;
  needs_count: number;
  gaps_count: number;
  patterns_count: number;
  critical_count: number;
  avg_confidence: number;
  validated_count: number;
  culturally_approved_count: number;
  latest_insight_date: string;
}

interface RealtimeMetric {
  id: string;
  metric_name: string;
  metric_category: string;
  metric_value: number;
  time_window_start: string;
  time_window_end: string;
}

export default function IntelligenceDatabaseDashboard() {
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [summary, setSummary] = useState<CommunityIntelligenceSummary[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [selectedCommunity]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [insightsResponse, summaryResponse, metricsResponse] = await Promise.all([
        fetch(`/api/intelligence/insights?${selectedCommunity ? `communityId=${selectedCommunity}&` : ''}limit=20`),
        fetch('/api/intelligence/summary?type=overview'),
        fetch('/api/intelligence/analytics/metrics?hoursBack=24')
      ]);

      if (!insightsResponse.ok || !summaryResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [insightsData, summaryData, metricsData] = await Promise.all([
        insightsResponse.json(),
        summaryResponse.json(),
        metricsResponse.json()
      ]);

      setInsights(insightsData.data || []);
      setSummary(summaryData.data || []);
      setMetrics(metricsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'community_validated':
      case 'expert_validated': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'needs_review': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCulturalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'requires_modification': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatInsightType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateOverallHealth = () => {
    if (summary.length === 0) return 0;
    
    const totalInsights = summary.reduce((sum, s) => sum + s.total_insights, 0);
    const validatedInsights = summary.reduce((sum, s) => sum + s.validated_count, 0);
    const culturallyApproved = summary.reduce((sum, s) => sum + s.culturally_approved_count, 0);
    
    if (totalInsights === 0) return 0;
    
    const validationRate = (validatedInsights / totalInsights) * 100;
    const culturalRate = (culturallyApproved / totalInsights) * 100;
    
    return Math.round((validationRate + culturalRate) / 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading intelligence dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Database Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Enhanced community intelligence with real-time analytics and cultural safety
          </p>
        </div>
        <Button onClick={loadDashboardData} className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.reduce((sum, s) => sum + s.total_insights, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {summary.length} communities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.reduce((sum, s) => sum + s.critical_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.length > 0 ? Math.round(
                (summary.reduce((sum, s) => sum + s.validated_count, 0) / 
                 summary.reduce((sum, s) => sum + s.total_insights, 0)) * 100
              ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Community & expert validated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultural Safety</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calculateOverallHealth()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall compliance score
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Recent Insights</TabsTrigger>
          <TabsTrigger value="communities">Community Summary</TabsTrigger>
          <TabsTrigger value="metrics">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Intelligence Insights
              </CardTitle>
              <CardDescription>
                Latest AI-generated insights with validation and cultural review status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        <p className="text-gray-600 mt-1">{insight.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={`${getUrgencyColor(insight.urgency_level)} text-white`}>
                          {insight.urgency_level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {formatInsightType(insight.insight_type)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Confidence:</span>
                          <Progress 
                            value={insight.confidence_score * 100} 
                            className="w-20 h-2"
                          />
                          <span className="text-sm font-medium">
                            {Math.round(insight.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`${getValidationStatusColor(insight.validation_status)} text-white text-xs`}>
                          {insight.validation_status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getCulturalStatusColor(insight.cultural_review_status)} text-white text-xs`}>
                          Cultural: {insight.cultural_review_status}
                        </Badge>
                      </div>
                    </div>

                    {insight.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {insight.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(insight.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}

                {insights.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No insights available. Generate some insights to see them here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Intelligence Summary
              </CardTitle>
              <CardDescription>
                Overview of intelligence insights by community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.map((community) => (
                  <div key={community.community_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{community.community_name}</h3>
                      <Badge variant="outline">
                        {community.total_insights} insights
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {community.needs_count}
                        </div>
                        <div className="text-xs text-gray-500">Needs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {community.gaps_count}
                        </div>
                        <div className="text-xs text-gray-500">Gaps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {community.patterns_count}
                        </div>
                        <div className="text-xs text-gray-500">Patterns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {community.critical_count}
                        </div>
                        <div className="text-xs text-gray-500">Critical</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span>
                          Avg Confidence: {Math.round((community.avg_confidence || 0) * 100)}%
                        </span>
                        <span>
                          Validated: {community.validated_count}/{community.total_insights}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Last Update: {new Date(community.latest_insight_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}

                {summary.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No community data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Real-time System Metrics
              </CardTitle>
              <CardDescription>
                Live performance and usage metrics from the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{metric.metric_name}</div>
                      <div className="text-sm text-gray-500">{metric.metric_category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.metric_value}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(metric.time_window_start).toLocaleTimeString()} - 
                        {new Date(metric.time_window_end).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {metrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No metrics data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Intelligence Analytics
              </CardTitle>
              <CardDescription>
                Advanced analytics and pattern recognition across communities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Advanced analytics features coming soon...
                <br />
                This will include cross-community pattern analysis, trend detection, and predictive insights.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}