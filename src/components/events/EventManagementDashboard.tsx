'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock,
  Plus,
  Edit,
  Eye,
  Settings,
  BookOpen,
  Mic,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  Globe,
  Shield,
  Crown,
  Video,
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  UserCheck,
  MessageSquare
} from 'lucide-react';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  status: string;
  startDate: Date;
  endDate: Date;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  currentAttendees: number;
  organizerName: string;
  culturalSafety: string;
  requiresElderPresence: boolean;
  facilitators: string[];
  requiresRegistration: boolean;
  knowledgeCaptureEnabled: boolean;
  tags: string[];
}

interface EventManagementDashboardProps {
  communityId: string;
  userRole: 'admin' | 'organizer' | 'facilitator' | 'community_member';
  userId: string;
}

export default function EventManagementDashboard({
  communityId,
  userRole,
  userId
}: EventManagementDashboardProps) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadEvents();
    loadStatistics();
  }, [communityId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock data - would integrate with event management service
      const mockEvents: CommunityEvent[] = [
        {
          id: '1',
          title: 'Traditional Knowledge Sharing Workshop',
          description: 'A workshop focused on sharing and preserving traditional knowledge within our community',
          eventType: 'workshop',
          status: 'published',
          startDate: new Date('2024-02-15T10:00:00'),
          endDate: new Date('2024-02-15T15:00:00'),
          location: 'Tennant Creek Community Centre',
          isVirtual: false,
          maxAttendees: 25,
          currentAttendees: 18,
          organizerName: 'Community Coordinator',
          culturalSafety: 'community',
          requiresElderPresence: true,
          facilitators: ['Elder Mary Johnson', 'Cultural Officer'],
          requiresRegistration: true,
          knowledgeCaptureEnabled: true,
          tags: ['traditional knowledge', 'cultural preservation', 'elders']
        },
        {
          id: '2',
          title: 'Youth Leadership Training',
          description: 'Training program to develop leadership skills among young community members',
          eventType: 'training',
          status: 'ongoing',
          startDate: new Date('2024-02-10T09:00:00'),
          endDate: new Date('2024-02-12T17:00:00'),
          location: 'Youth Centre',
          isVirtual: false,
          maxAttendees: 15,
          currentAttendees: 12,
          organizerName: 'Youth Coordinator',
          culturalSafety: 'public',
          requiresElderPresence: false,
          facilitators: ['Youth Coordinator', 'Leadership Mentor'],
          requiresRegistration: true,
          knowledgeCaptureEnabled: true,
          tags: ['youth', 'leadership', 'training']
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // Mock statistics - would integrate with actual service
      const mockStats = {
        totalEvents: 12,
        completedEvents: 8,
        totalAttendees: 156,
        averageAttendance: 19,
        eventsByType: {
          workshop: 6,
          meeting: 3,
          training: 2,
          ceremony: 1
        },
        knowledgeCaptured: 45,
        culturalEvents: 4
      };

      setStatistics(mockStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      published: { color: 'bg-blue-100 text-blue-800', icon: Globe },
      ongoing: { color: 'bg-green-100 text-green-800', icon: Clock },
      completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.draft;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCulturalSafetyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'community': return Users;
      case 'restricted': return Shield;
      case 'sacred': return Crown;
      default: return Globe;
    }
  };

  const getCulturalSafetyColor = (level: string) => {
    switch (level) {
      case 'public': return 'text-green-600';
      case 'community': return 'text-blue-600';
      case 'restricted': return 'text-yellow-600';
      case 'sacred': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'workshop': return BookOpen;
      case 'meeting': return Users;
      case 'training': return UserCheck;
      case 'ceremony': return Crown;
      case 'consultation': return MessageSquare;
      case 'celebration': return Calendar;
      default: return Calendar;
    }
  };

  const filterEventsByTab = (events: CommunityEvent[]) => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return events.filter(event => 
          event.startDate > now && ['published', 'draft'].includes(event.status)
        );
      case 'ongoing':
        return events.filter(event => 
          event.status === 'ongoing' || 
          (event.startDate <= now && event.endDate >= now && event.status === 'published')
        );
      case 'completed':
        return events.filter(event => 
          event.status === 'completed' || 
          (event.endDate < now && event.status === 'published')
        );
      case 'draft':
        return events.filter(event => event.status === 'draft');
      default:
        return events;
    }
  };

  const filteredEvents = filterEventsByTab(events);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Event Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage community workshops, meetings, and cultural events
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'organizer') && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.totalAttendees}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.averageAttendance}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Knowledge Captured</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.knowledgeCaptured}</p>
                </div>
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({filterEventsByTab(events).length})
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Ongoing ({events.filter(e => e.status === 'ongoing').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({events.filter(e => e.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({events.filter(e => e.status === 'draft').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} events
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'draft' 
                    ? 'Create a new event to get started.'
                    : `There are no ${activeTab} events at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {event.title}
                          </h3>
                          {getStatusBadge(event.status)}
                          {event.requiresElderPresence && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Elder Required
                            </Badge>
                          )}
                          {event.knowledgeCaptureEnabled && (
                            <Badge className="bg-green-100 text-green-800">
                              <Mic className="w-3 h-3 mr-1" />
                              Knowledge Capture
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            {React.createElement(getEventTypeIcon(event.eventType), { 
                              className: "w-4 h-4 mr-2" 
                            })}
                            <span className="capitalize">{event.eventType}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{event.startDate.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{event.isVirtual ? 'Virtual' : event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span>
                              {event.currentAttendees}
                              {event.maxAttendees && `/${event.maxAttendees}`} attendees
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            {React.createElement(getCulturalSafetyIcon(event.culturalSafety), { 
                              className: `w-4 h-4 mr-1 ${getCulturalSafetyColor(event.culturalSafety)}` 
                            })}
                            <span className="capitalize">{event.culturalSafety}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span>Organized by {event.organizerName}</span>
                          {event.facilitators.length > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>Facilitated by {event.facilitators.join(', ')}</span>
                            </>
                          )}
                        </div>

                        {event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {event.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {(userRole === 'admin' || userRole === 'organizer') && (
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}