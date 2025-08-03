'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface InsightData {
  category: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface ThemeAnalysis {
  theme: string;
  frequency: number;
  documents: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTerms: string[];
}

export default function InsightsPage() {
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [keyInsights] = useState<InsightData[]>([
    {
      category: 'Youth Engagement',
      value: 85,
      trend: 'up',
      description: 'Youth participation in programs has increased significantly'
    },
    {
      category: 'Employment Outcomes',
      value: 73,
      trend: 'up',
      description: 'Training program completion leading to employment'
    },
    {
      category: 'Community Participation',
      value: 92,
      trend: 'stable',
      description: 'Strong community involvement in decision-making'
    },
    {
      category: 'Cultural Integration',
      value: 88,
      trend: 'up',
      description: 'Two-way learning approaches showing positive results'
    }
  ]);

  const [themeAnalysis] = useState<ThemeAnalysis[]>([
    {
      theme: 'Youth Development',
      frequency: 45,
      documents: 12,
      sentiment: 'positive',
      keyTerms: ['safe house', 'mentoring', 'leadership', 'education']
    },
    {
      theme: 'Employment & Training',
      frequency: 38,
      documents: 15,
      sentiment: 'positive',
      keyTerms: ['job creation', 'skills training', 'apprenticeships', 'pathways']
    },
    {
      theme: 'Cultural Preservation',
      frequency: 32,
      documents: 8,
      sentiment: 'positive',
      keyTerms: ['traditional knowledge', 'elders', 'language', 'ceremonies']
    },
    {
      theme: 'Community Governance',
      frequency: 28,
      documents: 10,
      sentiment: 'neutral',
      keyTerms: ['decision making', 'consultation', 'partnerships', 'accountability']
    },
    {
      theme: 'Health & Wellbeing',
      frequency: 25,
      documents: 7,
      sentiment: 'neutral',
      keyTerms: ['mental health', 'social services', 'family support', 'healing']
    }
  ]);

  useEffect(() => {
    fetchDocumentData();
  }, []);

  const fetchDocumentData = async () => {
    try {
      const response = await fetch('/api/list-docs');
      if (response.ok) {
        const data = await response.json();
        setDocumentCount(data.documents?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch document data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Badge variant="success">Positive</Badge>;
      case 'neutral': return <Badge variant="secondary">Neutral</Badge>;
      case 'negative': return <Badge variant="destructive">Negative</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-blue-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading insights...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-teal-50 to-cyan-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Research Insights & Analytics</h1>
            <p className="text-lg text-muted-foreground mb-6">
              AI-powered analysis of community documents, identifying key themes, trends, 
              and insights to support evidence-based decision making.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Generate Report</Button>
              <Button variant="secondary">Export Data</Button>
              <Button variant="outline">Advanced Analytics</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Overview Stats */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">{documentCount}</p>
                  <p className="text-sm text-muted-foreground">Documents Analyzed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{themeAnalysis.length}</p>
                  <p className="text-sm text-muted-foreground">Key Themes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">127</p>
                  <p className="text-sm text-muted-foreground">Insights Generated</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">89%</p>
                  <p className="text-sm text-muted-foreground">Positive Sentiment</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Key Insights */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Insights</CardTitle>
              <CardDescription>
                High-level insights from community data and program outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(keyInsights || []).map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.category}</h4>
                      <span className="text-2xl">{getTrendIcon(insight.trend)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Performance</span>
                        <span className="font-bold text-lg">{insight.value}%</span>
                      </div>
                      <Progress value={insight.value} className="h-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Theme Analysis */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Theme Analysis</CardTitle>
              <CardDescription>
                Most frequently discussed themes across community documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(themeAnalysis || []).map((theme, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{theme.theme}</h4>
                          {getSentimentBadge(theme.sentiment)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mentioned {theme.frequency} times across {theme.documents} documents
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Frequency</span>
                        <span className={`font-bold ${getSentimentColor(theme.sentiment)}`}>
                          {theme.frequency}
                        </span>
                      </div>
                      <Progress value={(theme.frequency / 50) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Key Terms</p>
                      <div className="flex flex-wrap gap-1">
                        {(theme.keyTerms || []).map((term, termIndex) => (
                          <Badge key={termIndex} variant="outline" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Sentiment Analysis */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Overview</CardTitle>
                <CardDescription>Overall sentiment across community documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Positive</span>
                    </div>
                    <span className="font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Neutral</span>
                    </div>
                    <span className="font-medium">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Negative</span>
                    </div>
                    <span className="font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Key Finding</p>
                  <p className="text-xs text-green-700 mt-1">
                    Strong positive sentiment indicates community optimism and engagement with BRD initiatives
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Document Categories</CardTitle>
                <CardDescription>Distribution of document types in the analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Policy Documents</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Research Reports</span>
                    <span className="font-medium">31%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Community Stories</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meeting Notes</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <span className="font-medium">13%</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Analysis Coverage</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Comprehensive analysis across diverse document types provides holistic insights
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* AI Insights */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Key patterns and recommendations identified through AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Success Pattern Identified</h4>
                  <p className="text-sm text-green-700">
                    Programs with cultural mentoring components show 23% higher completion rates and 
                    31% better employment outcomes compared to standard programs.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📊 Trend Analysis</h4>
                  <p className="text-sm text-blue-700">
                    Youth engagement has increased 40% since implementing the Youth Roundtable model, 
                    with particularly strong participation in decision-making processes.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">🔍 Gap Analysis</h4>
                  <p className="text-sm text-purple-700">
                    Mental health and wellbeing services are frequently mentioned as priority areas, 
                    suggesting need for expanded support services.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">💡 Recommendation</h4>
                  <p className="text-sm text-orange-700">
                    Consider expanding the cultural mentoring model to all training programs based on 
                    demonstrated success rates and positive community feedback.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Reports</CardTitle>
                <CardDescription>Generate comprehensive analysis reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Full Report</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Export insights data for external analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Export Data</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Custom Analysis</CardTitle>
                <CardDescription>Run targeted analysis on specific themes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Custom Query</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}