'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Input } from '@/components/core';

interface CommunityConversation {
  id: string;
  title: string;
  date: string;
  type: 'youth-roundtable' | 'elder-consultation' | 'success-story' | 'systems-change';
  culturalSensitivity: 'public' | 'community' | 'sacred';
  content: string;
  themes: string[];
  keyInsights: string[];
  communityImpact: string;
  relatedInitiatives: string[];
}

interface CommunityInsight {
  insight: string;
  evidence: string[];
  actionItems: string[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<CommunityConversation[]>([]);
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<CommunityConversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/community-conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'youth-roundtable': return 'bg-green-500';
      case 'elder-consultation': return 'bg-purple-500';
      case 'success-story': return 'bg-blue-500';
      case 'systems-change': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getSensitivityBadge = (sensitivity: string) => {
    switch (sensitivity) {
      case 'public': return <Badge variant="success">Public</Badge>;
      case 'community': return <Badge variant="secondary">Community</Badge>;
      case 'sacred': return <Badge variant="destructive">Sacred</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || conv.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading community conversations...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Conversations</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Explore community consultations, youth roundtables, success stories, and systems change 
              initiatives that inform the Barkly Regional Deal.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" onClick={() => window.location.href = '/community-input'}>
                Add Your Voice
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/heat-map'}>
                View Heat Map
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/insights'}>
                Analysis & Insights
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Explore Conversations</CardTitle>
              <CardDescription>Search and filter community conversations by type and theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Conversation Type</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="youth-roundtable">Youth Roundtables</option>
                    <option value="elder-consultation">Elder Consultations</option>
                    <option value="success-story">Success Stories</option>
                    <option value="systems-change">Systems Change</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedType('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Conversations List */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Community Conversations ({filteredConversations.length})</CardTitle>
                  <CardDescription>
                    Recent community input and consultations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No conversations found matching your criteria.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.href = '/community-input'}
                      >
                        Add First Conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredConversations.map((conversation) => (
                        <div 
                          key={conversation.id} 
                          className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getTypeColor(conversation.type)}`}></div>
                                <h4 className="font-medium">{conversation.title}</h4>
                                {getSensitivityBadge(conversation.culturalSensitivity)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {new Date(conversation.date).toLocaleDateString()} • {conversation.type.replace('-', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          {conversation.themes.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Key Themes</p>
                              <div className="flex flex-wrap gap-1">
                                {conversation.themes.slice(0, 4).map((theme, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {theme}
                                  </Badge>
                                ))}
                                {conversation.themes.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{conversation.themes.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            {conversation.communityImpact}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Conversation Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedConversation ? 'Conversation Details' : 'Select a Conversation'}
                  </CardTitle>
                  <CardDescription>
                    {selectedConversation ? 'Full conversation content' : 'Click on a conversation to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedConversation.title}</h4>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline" className="capitalize">
                            {selectedConversation.type.replace('-', ' ')}
                          </Badge>
                          {getSensitivityBadge(selectedConversation.culturalSensitivity)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedConversation.date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {selectedConversation.keyInsights.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">Key Insights</p>
                          <div className="space-y-2">
                            {selectedConversation.keyInsights.slice(0, 3).map((insight, index) => (
                              <p key={index} className="text-sm text-muted-foreground italic">
                                {insight}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedConversation.relatedInitiatives.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">Related Initiatives</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedConversation.relatedInitiatives.map((initiative, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {initiative}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium mb-2">Community Impact</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.communityImpact}
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button size="sm" variant="outline" className="w-full">
                          View Full Content
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Click on any conversation to view detailed information and key insights.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Community Insights */}
      {insights.length > 0 && (
        <section className="py-8 bg-muted/30">
          <Container>
            <Card>
              <CardHeader>
                <CardTitle>Community Insights</CardTitle>
                <CardDescription>
                  Key patterns and recommendations from community conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {insights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-blue-600">{insight.insight}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-2">Evidence From</p>
                          <ul className="space-y-1">
                            {insight.evidence.map((evidence, evidenceIndex) => (
                              <li key={evidenceIndex} className="text-muted-foreground">• {evidence}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Recommended Actions</p>
                          <ul className="space-y-1">
                            {insight.actionItems.map((action, actionIndex) => (
                              <li key={actionIndex} className="text-muted-foreground">• {action}</li>
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
      )}

      {/* Quick Actions */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Your Voice</CardTitle>
                <CardDescription>Add your community input and priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/community-input'}
                >
                  Submit Input
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Visual Analysis</CardTitle>
                <CardDescription>Explore community priorities on the heat map</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/heat-map'}
                >
                  Heat Map
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detailed Insights</CardTitle>
                <CardDescription>AI-powered analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/insights'}
                >
                  View Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}