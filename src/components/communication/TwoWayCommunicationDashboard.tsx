'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Eye,
  Filter,
  Search,
  Plus,
  FileText,
  UserCheck,
  TrendingUp,
  BarChart3,
  Bell,
  Settings,
  ArrowRight,
  MapPin,
  Star
} from 'lucide-react';
import { twoWayCommunicationService, CommunityFeedback, MeetingSummary, ConsultationSession } from '@/lib/community/two-way-communication-service';

interface TwoWayCommunicationDashboardProps {
  communityId?: string;
  userRole?: 'community_member' | 'working_group_member' | 'moderator' | 'admin';
}

interface CommunicationMetrics {
  totalFeedback: number;
  pendingFeedback: number;
  responseRate: number;
  avgResponseTime: number;
  feedbackByCategory: { [key: string]: number };
  workingGroupPerformance: { [key: string]: any };
  upcomingConsultations: number;
  recentMeetings: number;
}

const TwoWayCommunicationDashboard: React.FC<TwoWayCommunicationDashboardProps> = ({
  communityId,
  userRole = 'community_member'
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'meetings' | 'consultations' | 'metrics'>('feedback');
  const [feedback, setFeedback] = useState<CommunityFeedback[]>([]);
  const [meetingSummaries, setMeetingSummaries] = useState<MeetingSummary[]>([]);
  const [consultations, setConsultations] = useState<ConsultationSession[]>([]);
  const [metrics, setMetrics] = useState<CommunicationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<CommunityFeedback | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSummary | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationSession | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    content: '',
    category: 'other' as CommunityFeedback['category'],
    feedbackType: 'suggestion' as CommunityFeedback['feedbackType'],
    priority: 'medium' as CommunityFeedback['priority'],
    culturalContext: '',
    traditionalKnowledgeInvolved: false
  });

  useEffect(() => {
    loadDashboardData();
  }, [communityId, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load metrics (would typically come from API)
      const mockMetrics: CommunicationMetrics = {
        totalFeedback: 45,
        pendingFeedback: 12,
        responseRate: 87.5,
        avgResponseTime: 18.5,
        feedbackByCategory: {
          healthcare: 15,
          education: 12,
          housing: 8,
          culture: 6,
          environment: 4
        },
        workingGroupPerformance: {
          'Health Working Group': { feedbackCount: 15, responseRate: 90, avgResponseTime: 16 },
          'Education Working Group': { feedbackCount: 12, responseRate: 85, avgResponseTime: 20 },
          'Housing Working Group': { feedbackCount: 8, responseRate: 88, avgResponseTime: 22 }
        },
        upcomingConsultations: 3,
        recentMeetings: 8
      };
      
      setMetrics(mockMetrics);
      
      // Load data based on active tab
      if (activeTab === 'feedback') {
        // Mock feedback data
        const mockFeedback: CommunityFeedback[] = [
          {
            id: 'feedback-1',
            channelId: 'channel-1',
            submittedBy: 'user-1',
            submitterName: 'Maria Thunderheart',
            submitterRole: 'community_member',
            communityId: communityId || 'community-1',
            communityName: 'Bearcloud First Nation',
            feedbackType: 'concern',
            category: 'healthcare',
            priority: 'high',
            subject: 'Need for Traditional Healing Integration',
            content: 'Our community clinic should better integrate traditional healing practices with modern medicine.',
            attachments: [],
            culturalContext: 'Traditional healing is important to our community',
            traditionalKnowledgeInvolved: true,
            elderConsultationRequired: true,
            routingInfo: {
              routedTo: 'health-working-group',
              routedToName: 'Health Working Group',
              routingReason: 'Healthcare category',
              routedBy: 'system',
              routedAt: new Date('2024-01-15'),
              estimatedResponseTime: 72
            },
            status: 'in_progress',
            responses: [],
            followUpActions: [],
            submittedAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-16')
          }
        ];
        setFeedback(mockFeedback);
      } else if (activeTab === 'meetings') {
        const publishedSummaries = await twoWayCommunicationService.getPublishedMeetingSummaries();
        setMeetingSummaries(publishedSummaries);
      } else if (activeTab === 'consultations') {
        const upcomingConsultations = await twoWayCommunicationService.getUpcomingConsultations(communityId);
        setConsultations(upcomingConsultations);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const feedbackData = {
        channelId: 'channel-feedback-portal',
        submittedBy: 'current-user',
        submitterName: 'Current User',
        submitterRole: 'community_member' as const,
        communityId: communityId || 'community-1',
        communityName: 'Current Community',
        ...feedbackForm,
        attachments: []
      };

      await twoWayCommunicationService.submitFeedback(feedbackData);
      
      // Reset form
      setFeedbackForm({
        subject: '',
        content: '',
        category: 'other',
        feedbackType: 'suggestion',
        priority: 'medium',
        culturalContext: '',
        traditionalKnowledgeInvolved: false
      });
      
      setShowFeedbackForm(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRegisterForConsultation = async (consultationId: string) => {
    try {
      await twoWayCommunicationService.registerForConsultation(consultationId, {
        name: 'Current User',
        role: 'Community Member',
        communityAffiliation: communityId || 'community-1',
        contributionLevel: 'participant'
      });
      
      await loadDashboardData();
    } catch (error) {
      console.error('Error registering for consultation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'responded':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'routed':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'received':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Communication</h1>
          <p className="text-gray-600">
            Engage with your community through feedback, meetings, and consultations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {userRole === 'community_member' && (
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalFeedback}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgResponseTime.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.responseRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Consultations</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.upcomingConsultations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'feedback', label: 'Community Feedback', icon: MessageSquare },
            { id: 'meetings', label: 'Meeting Summaries', icon: FileText },
            { id: 'consultations', label: 'Consultations', icon: Users },
            { id: 'metrics', label: 'Performance Metrics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="routed">Routed</option>
                <option value="in_progress">In Progress</option>
                <option value="responded">Responded</option>
                <option value="resolved">Resolved</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="housing">Housing</option>
                <option value="culture">Culture</option>
                <option value="environment">Environment</option>
                <option value="governance">Governance</option>
              </select>
            </div>
          </div>

          {/* Feedback List */}
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow border text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Found</h3>
                <p className="text-gray-600">
                  No feedback matches your current search criteria.
                </p>
              </div>
            ) : (
              feedback.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.subject}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{item.content}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <UserCheck className="w-4 h-4" />
                            <span>{item.submitterName}</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(item.submittedAt)}</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <ArrowRight className="w-4 h-4" />
                            <span>{item.routingInfo.routedToName}</span>
                          </span>
                          
                          <span className="capitalize">{item.category}</span>
                        </div>
                        
                        {item.traditionalKnowledgeInvolved && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <Star className="w-3 h-3 mr-1" />
                              Traditional Knowledge Involved
                            </span>
                          </div>
                        )}
                        
                        {item.culturalContext && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-800">
                              <span className="font-medium">Cultural Context:</span> {item.culturalContext}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedFeedback(item)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {meetingSummaries.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Meeting Summaries</h3>
              <p className="text-gray-600">
                No published meeting summaries are available.
              </p>
            </div>
          ) : (
            meetingSummaries.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meeting.title}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {meeting.meetingType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{meeting.summary}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{meeting.date.toLocaleDateString()}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{meeting.location}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{meeting.duration} minutes</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{meeting.attendees.length} attendees</span>
                        </span>
                      </div>
                      
                      {meeting.keyOutcomes.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Key Outcomes:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {meeting.keyOutcomes.slice(0, 3).map((outcome, index) => (
                              <li key={index}>{outcome}</li>
                            ))}
                            {meeting.keyOutcomes.length > 3 && (
                              <li className="text-gray-500">+{meeting.keyOutcomes.length - 3} more outcomes</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedMeeting(meeting)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="View Full Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {consultations.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Consultations</h3>
              <p className="text-gray-600">
                No consultation sessions are currently scheduled.
              </p>
            </div>
          ) : (
            consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.title}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {consultation.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{consultation.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{consultation.scheduledDate.toLocaleDateString()}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{consultation.scheduledDate.toLocaleTimeString()}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{consultation.location}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{consultation.participants.length} registered</span>
                        </span>
                      </div>
                      
                      {consultation.culturalProtocols.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Cultural Protocols:</h4>
                          <div className="flex flex-wrap gap-2">
                            {consultation.culturalProtocols.map((protocol, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                              >
                                {protocol}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedConsultation(consultation)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {consultation.registrationRequired && consultation.status === 'open_registration' && (
                        <button
                          onClick={() => handleRegisterForConsultation(consultation.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          {/* Feedback by Category Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Category</h3>
            <div className="space-y-3">
              {Object.entries(metrics.feedbackByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize text-gray-700">{category}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...Object.values(metrics.feedbackByCategory))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Working Group Performance */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Group Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(metrics.workingGroupPerformance).map(([groupName, performance]) => (
                    <tr key={groupName}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {groupName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {performance.feedbackCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {performance.responseRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {performance.avgResponseTime.toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Submission Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Submit Community Feedback</h2>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select
                    value={feedbackForm.feedbackType}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="concern">Concern</option>
                    <option value="complaint">Complaint</option>
                    <option value="question">Question</option>
                    <option value="compliment">Compliment</option>
                    <option value="request">Request</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="housing">Housing</option>
                    <option value="employment">Employment</option>
                    <option value="culture">Culture</option>
                    <option value="environment">Environment</option>
                    <option value="governance">Governance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={feedbackForm.priority}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief summary of your feedback"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Feedback
                </label>
                <textarea
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide detailed information about your feedback..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cultural Context (Optional)
                </label>
                <textarea
                  value={feedbackForm.culturalContext}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, culturalContext: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any cultural context or traditional knowledge relevant to this feedback..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="traditionalKnowledge"
                  checked={feedbackForm.traditionalKnowledgeInvolved}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, traditionalKnowledgeInvolved: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="traditionalKnowledge" className="ml-2 text-sm text-gray-700">
                  This feedback involves traditional knowledge or cultural practices
                </label>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackForm.subject.trim() || !feedbackForm.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedFeedback.subject}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                    {selectedFeedback.priority.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Submitted by:</span>
                    <span className="ml-2 text-gray-600">{selectedFeedback.submitterName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedFeedback.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <span className="ml-2 text-gray-600">{selectedFeedback.submittedAt.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Routed to:</span>
                    <span className="ml-2 text-gray-600">{selectedFeedback.routingInfo.routedToName}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{selectedFeedback.content}</p>
                </div>
                
                {selectedFeedback.culturalContext && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Cultural Context</h4>
                    <p className="text-purple-800">{selectedFeedback.culturalContext}</p>
                  </div>
                )}
              </div>

              {selectedFeedback.responses.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Responses</h4>
                  <div className="space-y-4">
                    {selectedFeedback.responses.map((response) => (
                      <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{response.responderName}</span>
                            <span className="text-sm text-gray-500">({response.responderRole})</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {response.responseType.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {response.respondedAt.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{response.content}</p>
                        
                        {response.actionsTaken.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-1">Actions Taken:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {response.actionsTaken.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {response.nextSteps.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-1">Next Steps:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {response.nextSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoWayCommunicationDashboard;