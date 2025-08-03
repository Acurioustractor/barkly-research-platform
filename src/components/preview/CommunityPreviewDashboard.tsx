'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface PreviewSession {
  id: string;
  title: string;
  description: string;
  community_id: string;
  scheduled_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participant_count: number;
  feedback_collected: boolean;
  cultural_protocols: {
    elder_presence_required: boolean;
    traditional_opening: boolean;
    language_support: string[];
    recording_permitted: boolean;
  };
  data_subset: {
    feature_areas: string[];
  };
}

interface FeedbackSummary {
  total_feedback: number;
  average_satisfaction: number;
  cultural_issues_count: number;
  accessibility_issues_count: number;
  cultural_compliance_score: number;
  accessibility_score: number;
}

interface StakeholderFeedback {
  id: string;
  stakeholder_type: string;
  organization: string;
  feedback_category: string;
  priority_level: string;
  submitted_at: string;
}

export default function CommunityPreviewDashboard() {
  const [sessions, setSessions] = useState<PreviewSession[]>([]);
  const [stakeholderFeedback, setStakeholderFeedback] = useState<StakeholderFeedback[]>([]);
  const [selectedSession, setSelectedSession] = useState<PreviewSession | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'feedback' | 'stakeholders'>('sessions');

  useEffect(() => {
    fetchPreviewSessions();
    fetchStakeholderFeedback();
  }, []);

  const fetchPreviewSessions = async () => {
    try {
      const response = await fetch('/api/preview/sessions');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error('Error fetching preview sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStakeholderFeedback = async () => {
    try {
      const response = await fetch('/api/preview/stakeholder-feedback');
      const data = await response.json();
      
      if (data.success) {
        setStakeholderFeedback(data.data);
      }
    } catch (error) {
      console.error('Error fetching stakeholder feedback:', error);
    }
  };

  const fetchFeedbackSummary = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/preview/analysis?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedbackSummary({
          total_feedback: data.data.total_feedback || 0,
          average_satisfaction: data.data.overall_satisfaction || 0,
          cultural_issues_count: data.data.critical_issues?.filter((issue: string) => 
            issue.toLowerCase().includes('cultural')).length || 0,
          accessibility_issues_count: data.data.critical_issues?.filter((issue: string) => 
            issue.toLowerCase().includes('accessibility')).length || 0,
          cultural_compliance_score: data.data.cultural_compliance_score || 100,
          accessibility_score: data.data.accessibility_score || 100
        });
      }
    } catch (error) {
      console.error('Error fetching feedback summary:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <ChartBarIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSessionSelect = (session: PreviewSession) => {
    setSelectedSession(session);
    if (session.feedback_collected) {
      fetchFeedbackSummary(session.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community Preview Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage community preview sessions and gather feedback on platform features
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.reduce((sum, s) => sum + s.participant_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stakeholder Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stakeholderFeedback.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preview Sessions
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Session Feedback
          </button>
          <button
            onClick={() => setActiveTab('stakeholders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stakeholders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stakeholder Feedback
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Preview Sessions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 ${
                    selectedSession?.id === session.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(session.status)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{session.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(session.scheduled_date)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{session.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {session.participant_count} participants
                      <span className="mx-2">•</span>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {session.duration_minutes} minutes
                    </div>
                  </div>
                  {session.cultural_protocols.elder_presence_required && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                        Elder Presence Required
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
            </div>
            {selectedSession ? (
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedSession.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedSession.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Scheduled Date</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedSession.scheduled_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-sm text-gray-900">{selectedSession.duration_minutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Participants</p>
                      <p className="text-sm text-gray-900">{selectedSession.participant_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                        {selectedSession.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Feature Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.data_subset.feature_areas.map((area, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {area.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Cultural Protocols</p>
                    <div className="space-y-2">
                      {selectedSession.cultural_protocols.elder_presence_required && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          Elder presence required
                        </div>
                      )}
                      {selectedSession.cultural_protocols.traditional_opening && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          Traditional opening ceremony
                        </div>
                      )}
                      {selectedSession.cultural_protocols.recording_permitted && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          Recording permitted
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedSession.feedback_collected && feedbackSummary && (
                  <div className="border-t border-gray-200 pt-6">
                    <h5 className="text-md font-medium text-gray-900 mb-4">Feedback Summary</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                        <p className="text-lg font-semibold text-gray-900">{feedbackSummary.total_feedback}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Average Satisfaction</p>
                        <div className="flex items-center">
                          <p className="text-lg font-semibold text-gray-900 mr-2">
                            {feedbackSummary.average_satisfaction.toFixed(1)}
                          </p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedbackSummary.average_satisfaction
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cultural Compliance</p>
                        <p className="text-lg font-semibold text-green-600">
                          {feedbackSummary.cultural_compliance_score.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Accessibility Score</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {feedbackSummary.accessibility_score.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Select a session to view details
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stakeholders' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Stakeholder Feedback</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stakeholderFeedback.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feedback.organization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feedback.stakeholder_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feedback.feedback_category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority_level)}`}>
                        {feedback.priority_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(feedback.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}