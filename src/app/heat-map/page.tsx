'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';

interface HeatSpot {
  id: string;
  title: string;
  category: 'youth-priority' | 'employment-success' | 'systems-change' | 'cultural-knowledge' | 'community-need';
  intensity: number; // 1-100
  location: {
    x: number; // percentage from left
    y: number; // percentage from top
  };
  description: string;
  communityEngagement: number;
  recentActivity: string[];
  relatedInitiatives: string[];
  culturalSensitivity: 'public' | 'community' | 'sacred';
}

interface CommunityInsight {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'challenging';
  locations: string[];
  keyQuotes: string[];
  actionItems: string[];
}

export default function HeatMapPage() {
  const [heatSpots, setHeatSpots] = useState<HeatSpot[]>([
    {
      id: '1',
      title: 'Youth Safe House Priority',
      category: 'youth-priority',
      intensity: 95,
      location: { x: 45, y: 30 },
      description: 'Urgent community priority for youth safe house with 24/7 support services',
      communityEngagement: 89,
      recentActivity: [
        'Youth Roundtable March 2024 - 17 participants',
        'Community petition - 234 signatures',
        'Council meeting presentation'
      ],
      relatedInitiatives: ['BRD Initiative #3', 'Youth Services Expansion'],
      culturalSensitivity: 'public'
    },
    {
      id: '2',
      title: 'Cultural Mentoring Success',
      category: 'employment-success',
      intensity: 78,
      location: { x: 60, y: 45 },
      description: 'High success rates in training programs with cultural mentoring support',
      communityEngagement: 73,
      recentActivity: [
        'James Thompson success story',
        '3 new mentor relationships established',
        'Certificate II completion rate: 87%'
      ],
      relatedInitiatives: ['BRD Initiative #7', 'BRD Initiative #12'],
      culturalSensitivity: 'public'
    },
    {
      id: '3',
      title: 'Health Services Transformation',
      category: 'systems-change',
      intensity: 82,
      location: { x: 35, y: 55 },
      description: 'Successful cultural transformation of hospital services',
      communityEngagement: 67,
      recentActivity: [
        'Patient satisfaction: 34% → 67%',
        'Cultural incident reports: 74% reduction',
        'Aboriginal staff: 8% → 23%'
      ],
      relatedInitiatives: ['BRD Initiative #15', 'Priority Reform #3'],
      culturalSensitivity: 'community'
    },
    {
      id: '4',
      title: 'Elder-Youth Connection',
      category: 'cultural-knowledge',
      intensity: 71,
      location: { x: 25, y: 40 },
      description: 'Strong community desire for enhanced Elder-youth cultural connection',
      communityEngagement: 85,
      recentActivity: [
        'Elder consultation on cultural protocols',
        'Two-way learning program design',
        'Traditional knowledge sharing sessions'
      ],
      relatedInitiatives: ['Cultural Preservation', 'Youth Development'],
      culturalSensitivity: 'community'
    },
    {
      id: '5',
      title: 'Mental Health Support Gap',
      category: 'community-need',
      intensity: 88,
      location: { x: 70, y: 35 },
      description: 'Identified gap in culturally appropriate mental health services',
      communityEngagement: 76,
      recentActivity: [
        'Youth Roundtable identified priority',
        '3-month waiting lists reported',
        'Community advocacy letter drafted'
      ],
      relatedInitiatives: ['Health Services', 'Youth Wellbeing'],
      culturalSensitivity: 'community'
    }
  ]);

  const [communityInsights, setCommunityInsights] = useState<CommunityInsight[]>([
    {
      theme: 'Cultural Mentoring Impact',
      frequency: 23,
      sentiment: 'positive',
      locations: ['Training Centers', 'Workplaces', 'Community Centers'],
      keyQuotes: [
        '"Having Uncle Billy as my cultural mentor made all the difference"',
        '"When I had a cultural mentor, I felt more confident to finish"'
      ],
      actionItems: [
        'Expand cultural mentoring to all training programs',
        'Establish mentor recognition program',
        'Create mentor training workshops'
      ]
    },
    {
      theme: 'Youth Safe Spaces',
      frequency: 19,
      sentiment: 'challenging',
      locations: ['Community Consultations', 'Youth Roundtables', 'Family Services'],
      keyQuotes: [
        '"We need somewhere safe to go when things get tough at home"',
        '"It should have food, laundry, and someone to talk to who understands"'
      ],
      actionItems: [
        'Accelerate safe house development',
        'Identify interim support options',
        'Engage youth in design process'
      ]
    },
    {
      theme: 'Two-Way Learning',
      frequency: 16,
      sentiment: 'positive',
      locations: ['Training Programs', 'Health Services', 'Education Settings'],
      keyQuotes: [
        '"Connect students with Elders who understand both worlds"',
        '"Traditional knowledge shared only with proper cultural context"'
      ],
      actionItems: [
        'Integrate two-way learning in all programs',
        'Develop Elder engagement protocols',
        'Create cultural curriculum resources'
      ]
    }
  ]);

  const [selectedSpot, setSelectedSpot] = useState<HeatSpot | null>(null);
  const [viewMode, setViewMode] = useState<'intensity' | 'engagement' | 'category'>('intensity');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'youth-priority': return '#10b981'; // green
      case 'employment-success': return '#3b82f6'; // blue
      case 'systems-change': return '#8b5cf6'; // purple
      case 'cultural-knowledge': return '#f59e0b'; // amber
      case 'community-need': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-blue-600';
      case 'challenging': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Badge variant="success">Positive</Badge>;
      case 'neutral': return <Badge variant="secondary">Neutral</Badge>;
      case 'challenging': return <Badge variant="destructive">Challenging</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIntensitySize = (intensity: number) => {
    if (intensity >= 80) return 24;
    if (intensity >= 60) return 20;
    if (intensity >= 40) return 16;
    return 12;
  };

  const getViewModeValue = (spot: HeatSpot) => {
    switch (viewMode) {
      case 'intensity': return spot.intensity;
      case 'engagement': return spot.communityEngagement;
      case 'category': return 50; // neutral for category view
      default: return spot.intensity;
    }
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-emerald-50 to-teal-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Heat Spot Map</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Interactive visualization of community priorities, engagement patterns, and emerging themes 
              based on conversations, consultations, and community-led intelligence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant={viewMode === 'intensity' ? 'primary' : 'outline'}
                onClick={() => setViewMode('intensity')}
              >
                Priority Intensity
              </Button>
              <Button 
                variant={viewMode === 'engagement' ? 'primary' : 'outline'}
                onClick={() => setViewMode('engagement')}
              >
                Community Engagement
              </Button>
              <Button 
                variant={viewMode === 'category' ? 'primary' : 'outline'}
                onClick={() => setViewMode('category')}
              >
                Category View
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Heat Map Visualization */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Community Priority Heat Map</CardTitle>
                  <CardDescription>
                    Click on heat spots to explore community priorities and engagement patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border overflow-hidden">
                    {/* Background map representation */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 left-4 text-xs text-muted-foreground">Tennant Creek</div>
                      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">Barkly Region</div>
                    </div>
                    
                    {/* Heat spots */}
                    {heatSpots.map((spot) => (
                      <div
                        key={spot.id}
                        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
                        style={{
                          left: `${spot.location.x}%`,
                          top: `${spot.location.y}%`,
                          width: `${getIntensitySize(getViewModeValue(spot))}px`,
                          height: `${getIntensitySize(getViewModeValue(spot))}px`,
                        }}
                        onClick={() => setSelectedSpot(spot)}
                      >
                        <div
                          className="w-full h-full rounded-full opacity-70 hover:opacity-90 flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            backgroundColor: getCategoryColor(spot.category),
                            boxShadow: `0 0 ${getViewModeValue(spot) / 4}px ${getCategoryColor(spot.category)}40`
                          }}
                        >
                          {getViewModeValue(spot)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Youth Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span>Employment Success</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                      <span>Systems Change</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                      <span>Cultural Knowledge</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Community Need</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Selected Spot Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedSpot ? 'Heat Spot Details' : 'Select a Heat Spot'}
                  </CardTitle>
                  <CardDescription>
                    {selectedSpot ? 'Community priority information' : 'Click on a spot to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSpot ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedSpot.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{selectedSpot.description}</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedSpot.category.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Priority Level</p>
                          <p className="text-2xl font-bold text-red-600">{selectedSpot.intensity}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Engagement</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedSpot.communityEngagement}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Recent Activity</p>
                        <ul className="text-sm space-y-1">
                          {selectedSpot.recentActivity.map((activity, index) => (
                            <li key={index} className="text-muted-foreground">• {activity}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Related Initiatives</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSpot.relatedInitiatives.map((initiative, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {initiative}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Click on any heat spot on the map to view detailed information about community priorities and engagement.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Community Insights */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Emerging Community Themes</CardTitle>
              <CardDescription>
                Key themes identified from community conversations and consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {communityInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{insight.theme}</h4>
                          {getSentimentBadge(insight.sentiment)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mentioned {insight.frequency} times across community conversations
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">Key Locations</p>
                        <ul className="space-y-1">
                          {insight.locations.map((location, locIndex) => (
                            <li key={locIndex} className="text-muted-foreground">• {location}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Community Voices</p>
                        <div className="space-y-2">
                          {insight.keyQuotes.slice(0, 2).map((quote, quoteIndex) => (
                            <p key={quoteIndex} className="text-xs italic text-muted-foreground">
                              "{quote}"
                            </p>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Action Items</p>
                        <ul className="space-y-1">
                          {insight.actionItems.slice(0, 3).map((action, actionIndex) => (
                            <li key={actionIndex} className="text-xs text-muted-foreground">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Community Engagement Tools */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Community Input</CardTitle>
                <CardDescription>Share your community priorities and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/community-input'}
                >
                  Submit Community Priority
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Join Conversation</CardTitle>
                <CardDescription>Participate in ongoing community discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Community Forums</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>Monitor how community priorities are being addressed</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Progress Dashboard</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}