'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

interface InsightData {
  totalDocuments: number;
  communitiesActive: number;
  culturalSensitivityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  recentThemes: Array<{
    theme: string;
    count: number;
    documents: string[];
  }>;
  communityBreakdown: Array<{
    community: string;
    documentCount: number;
    percentage: number;
  }>;
}

export default function ResearchInsights() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsightData();
  }, []);

  const fetchInsightData = async () => {
    try {
      const [documentsRes, communitiesRes] = await Promise.all([
        fetch('/api/documents/list'),
        fetch('/api/communities/list')
      ]);

      if (documentsRes.ok && communitiesRes.ok) {
        const documents = await documentsRes.json();
        const communities = await communitiesRes.json();

        const docs = documents.documents || [];
        const comms = communities.communities || [];

        // Calculate cultural sensitivity breakdown
        const culturalBreakdown = docs.reduce((acc: any, doc: any) => {
          const level = doc.cultural_sensitivity?.toLowerCase() || 'low';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, { high: 0, medium: 0, low: 0 });

        // Calculate community breakdown
        const communityStats = docs.reduce((acc: any, doc: any) => {
          const community = doc.community || 'General';
          acc[community] = (acc[community] || 0) + 1;
          return acc;
        }, {});

        const communityBreakdown = Object.entries(communityStats).map(([community, count]) => ({
          community,
          documentCount: count as number,
          percentage: Math.round(((count as number) / docs.length) * 100)
        }));

        // Mock themes for now - in real implementation, this would come from AI analysis
        const mockThemes = [
          { theme: 'Youth Employment', count: Math.floor(docs.length * 0.3), documents: ['doc1', 'doc2'] },
          { theme: 'Education Access', count: Math.floor(docs.length * 0.25), documents: ['doc3', 'doc4'] },
          { theme: 'Mental Health', count: Math.floor(docs.length * 0.2), documents: ['doc5', 'doc6'] },
          { theme: 'Cultural Identity', count: Math.floor(docs.length * 0.15), documents: ['doc7', 'doc8'] },
          { theme: 'Community Services', count: Math.floor(docs.length * 0.1), documents: ['doc9', 'doc10'] }
        ];

        setData({
          totalDocuments: docs.length,
          communitiesActive: comms.length,
          culturalSensitivityBreakdown: culturalBreakdown,
          recentThemes: mockThemes,
          communityBreakdown: communityBreakdown.sort((a, b) => b.documentCount - a.documentCount)
        });
      }
    } catch (error) {
      console.error('Failed to fetch insight data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load insights data</p>
        <Button onClick={fetchInsightData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{data.totalDocuments}</div>
              <p className="text-sm text-muted-foreground">Total Documents Analyzed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{data.communitiesActive}</div>
              <p className="text-sm text-muted-foreground">Active Communities</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{data.recentThemes.length}</div>
              <p className="text-sm text-muted-foreground">Key Themes Identified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cultural Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Sensitivity Distribution</CardTitle>
          <CardDescription>Breakdown of documents by cultural sensitivity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High Sensitivity</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(data.culturalSensitivityBreakdown.high / data.totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground w-8">{data.culturalSensitivityBreakdown.high}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Medium Sensitivity</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(data.culturalSensitivityBreakdown.medium / data.totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground w-8">{data.culturalSensitivityBreakdown.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Low Sensitivity</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(data.culturalSensitivityBreakdown.low / data.totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground w-8">{data.culturalSensitivityBreakdown.low}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Themes</CardTitle>
            <CardDescription>Most frequently identified themes across documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentThemes.map((theme, index) => (
                <div key={theme.theme} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">{theme.theme}</h4>
                    <p className="text-xs text-muted-foreground">{theme.count} documents</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Participation</CardTitle>
            <CardDescription>Document contributions by community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.communityBreakdown.slice(0, 5).map((community) => (
                <div key={community.community} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{community.community}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${community.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{community.documentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis Status</CardTitle>
          <CardDescription>Current state of automated document analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.totalDocuments}</div>
              <p className="text-sm text-green-700">Documents Processed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.recentThemes.length}</div>
              <p className="text-sm text-blue-700">Themes Extracted</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Ready</div>
              <p className="text-sm text-purple-700">System Status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}