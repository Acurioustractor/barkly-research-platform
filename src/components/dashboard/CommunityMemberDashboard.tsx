'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  Users,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  MessageCircle,
  Upload,
  ExternalLink,
  Phone,
  Clock,
  Award,
  Target,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

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
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number;
    confidence: number;
  };
  lastUpdated: Date;
}

interface ServiceListing {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  contact: string;
  hours: string;
  availability: 'available' | 'limited' | 'waitlist' | 'unavailable';
  culturallySafe: boolean;
  languages: string[];
}

interface CommunityStory {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  publishedAt: Date;
  mediaType: 'text' | 'audio' | 'video';
  culturalSafety: 'public' | 'community' | 'restricted';
  themes: string[];
  likes: number;
  isInspiring: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: 'employment' | 'education' | 'volunteer' | 'funding' | 'program';
  organization: string;
  deadline?: Date;
  location: string;
  requirements: string[];
  contact: string;
  isUrgent: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  category: string;
  registrationRequired: boolean;
  culturalProtocols: string[];
  capacity?: number;
  registered?: number;
}

interface CommunityMemberDashboardProps {
  communityId: string;
  userId?: string;
}

export default function CommunityMemberDashboard({
  communityId,
  userId
}: CommunityMemberDashboardProps) {
  const [communityHealth, setCommunityHealth] = useState<CommunityHealth | null>(null);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [communityId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all dashboard data in parallel
      const [healthRes, servicesRes, storiesRes, opportunitiesRes, eventsRes] = await Promise.all([
        fetch(`/api/intelligence/community-health?communityId=${communityId}`),
        fetch(`/api/community/services?communityId=${communityId}`),
        fetch(`/api/community/stories?communityId=${communityId}&limit=6`),
        fetch(`/api/community/opportunities?communityId=${communityId}&limit=8`),
        fetch(`/api/community/events?communityId=${communityId}&upcoming=true&limit=5`)
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setCommunityHealth(healthData.health);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

      if (storiesRes.ok) {
        const storiesData = await storiesRes.json();
        setStories(storiesData.stories || []);
      }

      if (opportunitiesRes.ok) {
        const opportunitiesData = await opportunitiesRes.json();
        setOpportunities(opportunitiesData.opportunities || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'text-green-600 bg-green-100';
      case 'developing': return 'text-blue-600 bg-blue-100';
      case 'improving': return 'text-yellow-600 bg-yellow-100';
      case 'struggling': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500 rotate-90" />;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'waitlist': return 'text-orange-600 bg-orange-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading dashboard: {error}</p>
            <Button onClick={loadDashboardData} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Community
          </h1>
          <p className="text-gray-600">
            {communityHealth?.name || 'Community Dashboard'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Provide Feedback
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Share Story
          </Button>
        </div>
      </div>

      {/* Community Health Overview */}
      {communityHealth && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Community Health</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(communityHealth.status)}>
                  {communityHealth.status}
                </Badge>
                {getTrendIcon(communityHealth.trends.direction)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Overall Health Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {communityHealth.healthScore}/100
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Youth Engagement</span>
                      <span>{communityHealth.indicators.youthEngagement}%</span>
                    </div>
                    <Progress value={communityHealth.indicators.youthEngagement} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Service Access</span>
                      <span>{communityHealth.indicators.serviceAccess}%</span>
                    </div>
                    <Progress value={communityHealth.indicators.serviceAccess} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cultural Connection</span>
                      <span>{communityHealth.indicators.culturalConnection}%</span>
                    </div>
                    <Progress value={communityHealth.indicators.culturalConnection} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Economic Opportunity</span>
                      <span>{communityHealth.indicators.economicOpportunity}%</span>
                    </div>
                    <Progress value={communityHealth.indicators.economicOpportunity} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Safety & Wellbeing</span>
                      <span>{communityHealth.indicators.safetyWellbeing}%</span>
                    </div>
                    <Progress value={communityHealth.indicators.safetyWellbeing} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Local Services</h2>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Services
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.slice(0, 6).map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge className={getAvailabilityColor(service.availability)}>
                      {service.availability}
                    </Badge>
                  </div>
                  <Badge variant="outline">{service.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{service.location}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{service.contact}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{service.hours}</span>
                    </div>
                  </div>

                  {service.culturallySafe && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Culturally Safe
                      </Badge>
                    </div>
                  )}

                  {service.languages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Languages: {service.languages.join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Community Stories</h2>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Share Your Story
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story) => (
              <Card key={story.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">by {story.author}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {story.isInspiring && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge variant="outline">{story.mediaType}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{story.excerpt}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {story.themes.slice(0, 3).map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{story.likes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Opportunities</h2>
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              View All Opportunities
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{opportunity.organization}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="outline">{opportunity.type}</Badge>
                      {opportunity.isUrgent && (
                        <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{opportunity.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{opportunity.location}</span>
                    </div>

                    {opportunity.deadline && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {opportunity.requirements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {opportunity.requirements.slice(0, 3).map((req, index) => (
                          <li key={index}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button size="sm" className="w-full">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>

                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{event.organizer}</span>
                        </div>
                      </div>

                      {event.culturalProtocols.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600">
                            Cultural protocols apply
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="outline">{event.category}</Badge>

                      {event.capacity && event.registered && (
                        <div className="text-xs text-gray-500">
                          {event.registered}/{event.capacity} registered
                        </div>
                      )}

                      <Button size="sm">
                        {event.registrationRequired ? 'Register' : 'Learn More'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Get Involved</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Upload className="h-6 w-6" />
              <span>Share Your Story</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <MessageCircle className="h-6 w-6" />
              <span>Provide Feedback</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <HeartHandshake className="h-6 w-6" />
              <span>Volunteer</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}