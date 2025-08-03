'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core/Card';

interface CommunityHealth {
  communityId: string;
  name: string;
  status: 'thriving' | 'developing' | 'struggling' | 'improving';
  healthScore: number;
  indicators: {
    youthEngagement: number;
    serviceAccess: number;
    culturalConnection: number;
    economicOpportunity: number;
    safetyWellbeing: number;
  };
  metrics?: {
    totalDocuments: number;
    recentDocuments: number;
    analysisCompleteness: number;
    dataFreshness: number;
    communityEngagement: number;
  };
  insights?: {
    topNeeds: Array<{ need: string; urgency: string; count: number }>;
    keyAssets: Array<{ asset: string; type: string; strength: number }>;
    criticalGaps: Array<{ service: string; impact: number; location: string }>;
    opportunities: Array<{ opportunity: string; potential: number; timeline: string }>;
  };
  lastUpdated: Date;
}

interface CommunityHealthIndicatorsProps {
  communityId?: string;
  showDetails?: boolean;
  className?: string;
}

export function CommunityHealthIndicators({ 
  communityId, 
  showDetails = true, 
  className = '' 
}: CommunityHealthIndicatorsProps) {
  const [health, setHealth] = useState<CommunityHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunityHealth();
  }, [communityId]);

  const fetchCommunityHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = communityId 
        ? `/api/intelligence/community-health?communityId=${communityId}`
        : '/api/intelligence/community-health';

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch community health');
      }

      if (communityId) {
        setHealth(data.health);
      } else {
        // For multiple communities, show the first one or aggregate
        setHealth(data.communities?.[0] || null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'text-green-600 bg-green-50';
      case 'developing': return 'text-blue-600 bg-blue-50';
      case 'improving': return 'text-yellow-600 bg-yellow-50';
      case 'struggling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIndicatorColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 50) return 'bg-blue-500';
    if (value >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading community health data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button 
              onClick={fetchCommunityHealth}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>No health data available</p>
            <p className="text-sm mt-1">Upload documents to generate community health insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{health.name} Community Health</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(health.healthScore)}`}>
                {health.healthScore}
              </div>
              <div className="text-sm text-gray-500">Health Score</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getIndicatorColor(health.healthScore)}`}
                  style={{ width: `${health.healthScore}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date(health.lastUpdated).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Individual Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(health.indicators).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getIndicatorColor(value)}`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium w-8 ${getScoreColor(value)}`}>
                      {value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Metrics */}
      {showDetails && health.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {health.metrics.totalDocuments}
                </div>
                <div className="text-sm text-gray-500">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {health.metrics.recentDocuments}
                </div>
                <div className="text-sm text-gray-500">Recent (30d)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {health.metrics.analysisCompleteness}%
                </div>
                <div className="text-sm text-gray-500">Analysis Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {showDetails && health.insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Needs */}
          {health.insights.topNeeds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Community Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.insights.topNeeds.slice(0, 5).map((need, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{need.need}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          need.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          need.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          need.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {need.urgency}
                        </span>
                        <span className="text-xs text-gray-500">({need.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Assets */}
          {health.insights.keyAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Community Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.insights.keyAssets.slice(0, 5).map((asset, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{asset.asset}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          asset.type === 'cultural' ? 'bg-purple-100 text-purple-800' :
                          asset.type === 'human' ? 'bg-blue-100 text-blue-800' :
                          asset.type === 'social' ? 'bg-green-100 text-green-800' :
                          asset.type === 'economic' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {asset.type}
                        </span>
                        <span className="text-xs font-medium">{asset.strength}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Gaps */}
          {health.insights.criticalGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Service Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.insights.criticalGaps.slice(0, 5).map((gap, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{gap.service}</div>
                        <div className="text-xs text-gray-500">{gap.location}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        gap.impact >= 8 ? 'bg-red-100 text-red-800' :
                        gap.impact >= 6 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Impact: {gap.impact}/10
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opportunities */}
          {health.insights.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.insights.opportunities.slice(0, 5).map((opp, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{opp.opportunity}</div>
                        <div className="text-xs text-gray-500">{opp.timeline}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        opp.potential >= 8 ? 'bg-green-100 text-green-800' :
                        opp.potential >= 6 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {opp.potential}/10
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityHealthIndicators;