'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';

interface CommunityStory {
  id: string;
  title: string;
  storyteller: string;
  community: string;
  category: 'success-story' | 'cultural-knowledge' | 'challenge' | 'innovation' | 'healing';
  culturalSensitivity: 'public' | 'community' | 'sacred';
  dateShared: string;
  summary: string;
  themes: string[];
  hasElderApproval: boolean;
  hasConsentForm: boolean;
  mediaType: 'text' | 'audio' | 'video' | 'multimedia';
  language: 'english' | 'warumungu' | 'warlpiri' | 'other';
  status: 'pending-review' | 'approved' | 'published' | 'archived';
}

export default function CommunityStories() {
  const [stories] = useState<CommunityStory[]>([
    {
      id: '1',
      title: 'From Training to Leadership: A Journey of Growth',
      storyteller: 'Community Member A',
      community: 'Tennant Creek',
      category: 'success-story',
      culturalSensitivity: 'public',
      dateShared: '2024-02-15',
      summary: 'A young person shares their journey from completing a Certificate II in Community Services to becoming a youth mentor and community leader.',
      themes: ['education', 'leadership', 'mentoring', 'community-development'],
      hasElderApproval: true,
      hasConsentForm: true,
      mediaType: 'multimedia',
      language: 'english',
      status: 'published'
    },
    {
      id: '2',
      title: 'Traditional Knowledge in Modern Training',
      storyteller: 'Elder Mary Johnson',
      community: 'Tennant Creek',
      category: 'cultural-knowledge',
      culturalSensitivity: 'community',
      dateShared: '2024-01-20',
      summary: 'An Elder shares how traditional knowledge systems can be integrated into contemporary training programs while maintaining cultural integrity.',
      themes: ['traditional-knowledge', 'education', 'cultural-preservation', 'two-way-learning'],
      hasElderApproval: true,
      hasConsentForm: true,
      mediaType: 'audio',
      language: 'warumungu',
      status: 'published'
    },
    {
      id: '3',
      title: 'Youth Safe House: A Community Vision',
      storyteller: 'Youth Roundtable',
      community: 'Tennant Creek',
      category: 'innovation',
      culturalSensitivity: 'public',
      dateShared: '2024-03-01',
      summary: 'Young people share their vision for a youth safe house and how community consultation shaped the final design and services.',
      themes: ['youth-services', 'community-consultation', 'safe-spaces', 'peer-support'],
      hasElderApproval: true,
      hasConsentForm: true,
      mediaType: 'video',
      language: 'english',
      status: 'approved'
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'success-story': return 'bg-green-500';
      case 'cultural-knowledge': return 'bg-purple-500';
      case 'challenge': return 'bg-orange-500';
      case 'innovation': return 'bg-blue-500';
      case 'healing': return 'bg-pink-500';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending-review': return <Badge variant="outline">Pending Review</Badge>;
      case 'approved': return <Badge variant="secondary">Approved</Badge>;
      case 'published': return <Badge variant="success">Published</Badge>;
      case 'archived': return <Badge variant="default">Archived</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'text': return '📝';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      case 'multimedia': return '🎬';
      default: return '📄';
    }
  };

  const publishedStories = stories.filter(s => s.status === 'published').length;
  const communityStories = stories.filter(s => s.culturalSensitivity === 'community').length;
  const multilingualStories = stories.filter(s => s.language !== 'english').length;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-pink-50 to-purple-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Stories & Cultural Knowledge</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Sharing community stories, traditional knowledge, and lived experiences with appropriate 
              cultural protocols, consent processes, and Elder approval.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Share Your Story</Button>
              <Button variant="secondary">Cultural Protocols</Button>
              <Button variant="outline">Story Guidelines</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Metrics */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stories.length}</p>
                  <p className="text-sm text-muted-foreground">Total Stories</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{publishedStories}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{communityStories}</p>
                  <p className="text-sm text-muted-foreground">Community Access</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{multilingualStories}</p>
                  <p className="text-sm text-muted-foreground">Multilingual</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-600">100%</p>
                  <p className="text-sm text-muted-foreground">Elder Approved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Cultural Protocols Notice */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🛡️</span>
                <span>Cultural Protocols & Consent</span>
              </CardTitle>
              <CardDescription>
                All stories shared here follow strict cultural protocols and consent processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">✓ Elder Approval</h4>
                  <p className="text-muted-foreground">All stories reviewed and approved by community Elders</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">✓ Informed Consent</h4>
                  <p className="text-muted-foreground">Storytellers provide written consent for sharing</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-purple-600">✓ Cultural Sensitivity</h4>
                  <p className="text-muted-foreground">Stories classified by appropriate access levels</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-600">✓ Community Control</h4>
                  <p className="text-muted-foreground">Community maintains ownership and control</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Story Collection */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Community Stories</CardTitle>
              <CardDescription>
                Stories of success, challenge, innovation, and cultural knowledge from the Barkly community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stories.map((story) => (
                  <div key={story.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(story.category)}`}></div>
                          <span className="text-lg">{getMediaIcon(story.mediaType)}</span>
                          <h4 className="font-medium">{story.title}</h4>
                          {getSensitivityBadge(story.culturalSensitivity)}
                          {getStatusBadge(story.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{story.summary}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Storyteller</p>
                        <p>{story.storyteller}</p>
                        <p className="text-xs text-muted-foreground">{story.community}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Category</p>
                        <p className="capitalize">{story.category.replace('-', ' ')}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Language</p>
                        <p className="capitalize">{story.language}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Date Shared</p>
                        <p>{new Date(story.dateShared).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {story.themes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Themes</p>
                        <div className="flex flex-wrap gap-1">
                          {story.themes.map((theme, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {theme.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span>{story.hasElderApproval ? '✅' : '❌'}</span>
                        <span>Elder Approval</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{story.hasConsentForm ? '✅' : '❌'}</span>
                        <span>Consent Form</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {story.status === 'published' && (
                        <Button size="sm" variant="outline">Read/Listen</Button>
                      )}
                      <Button size="sm" variant="ghost">View Details</Button>
                      {story.culturalSensitivity === 'community' && (
                        <Button size="sm" variant="ghost">Request Access</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Story Categories */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Story Categories</CardTitle>
                <CardDescription>Different types of community stories we collect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-sm">Success Stories</h4>
                      <p className="text-xs text-muted-foreground">
                        Celebrating achievements, milestones, and positive outcomes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-sm">Cultural Knowledge</h4>
                      <p className="text-xs text-muted-foreground">
                        Traditional knowledge, practices, and cultural teachings
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-sm">Innovation Stories</h4>
                      <p className="text-xs text-muted-foreground">
                        Creative solutions and new approaches to community challenges
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-sm">Challenge Stories</h4>
                      <p className="text-xs text-muted-foreground">
                        Learning from difficulties and building resilience
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-sm">Healing Stories</h4>
                      <p className="text-xs text-muted-foreground">
                        Stories of recovery, reconciliation, and community healing
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cultural Protocols</CardTitle>
                <CardDescription>How we protect and respect cultural knowledge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-sm text-green-800">Public Stories</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Stories that can be shared openly with appropriate attribution
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">Community Stories</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Stories restricted to community members and authorized partners
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-sm text-red-800">Sacred Stories</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Sacred knowledge requiring special protocols and Elder guidance
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-sm text-purple-800">Language Preservation</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      Stories in traditional languages with translation support
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Story Sharing Process */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>How to Share Your Story</CardTitle>
              <CardDescription>
                A respectful process that honors cultural protocols and community consent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-sm">Initial Contact</h4>
                  <p className="text-xs text-muted-foreground">
                    Reach out to community coordinators to discuss your story
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-sm">Cultural Review</h4>
                  <p className="text-xs text-muted-foreground">
                    Elders review the story for cultural appropriateness
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-sm">Consent Process</h4>
                  <p className="text-xs text-muted-foreground">
                    Complete informed consent forms and access permissions
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <h4 className="font-medium text-sm">Story Recording</h4>
                  <p className="text-xs text-muted-foreground">
                    Record your story in your preferred format and language
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-pink-600 font-bold">5</span>
                  </div>
                  <h4 className="font-medium text-sm">Community Sharing</h4>
                  <p className="text-xs text-muted-foreground">
                    Story is shared according to agreed cultural protocols
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
                <CardTitle>Share Your Story</CardTitle>
                <CardDescription>Begin the process of sharing your community story</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Story Submission</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cultural Guidelines</CardTitle>
                <CardDescription>Learn about our cultural protocols and consent process</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Guidelines</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Story Archive</CardTitle>
                <CardDescription>Browse published stories by theme and category</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Browse Archive</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}