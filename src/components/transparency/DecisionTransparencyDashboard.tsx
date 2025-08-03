'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  MessageSquare,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Download,
  Share2,
  Bell,
  TrendingUp,
  BarChart3,
  Globe,
  Shield,
  UserCheck
} from 'lucide-react';
import { decisionTransparencyService, GovernmentDecision } from '../../lib/decision-transparency-service';

interface DecisionTransparencyDashboardProps {
  communityId?: string;
  userRole?: 'community_member' | 'community_leader' | 'government_official' | 'public';
}

interface TransparencyMetrics {
  totalDecisions: number;
  publishedDecisions: number;
  pendingReview: number;
  avgPublicationDays: number;
  communityConsultations: number;
  feedbackItems: number;
  transparencyScore: number;
}

const DecisionTransparencyDashboard: React.FC<DecisionTransparencyDashboardProps> = ({
  communityId,
  userRole = 'public'
}) => {
  const [decisions, setDecisions] = useState<GovernmentDecision[]>([]);
  const [metrics, setMetrics] = useState<TransparencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<GovernmentDecision | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'support' | 'concern' | 'suggestion' | 'question' | 'objection'>('suggestion');

  useEffect(() => {
    loadDashboardData();
  }, [communityId, filterType, filterStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      let decisionsData: GovernmentDecision[] = [];
      
      if (communityId) {
        decisionsData = await decisionTransparencyService.getDecisionsByCommunity(communityId);
      } else {
        decisionsData = await decisionTransparencyService.getPublicDecisions(50, 0);
      }
      
      setDecisions(decisionsData);
      
      // Load metrics (would typically come from API)
      const mockMetrics: TransparencyMetrics = {
        totalDecisions: decisionsData.length,
        publishedDecisions: decisionsData.filter(d => d.publicationStatus === 'published').length,
        pendingReview: decisionsData.filter(d => d.publicationStatus === 'cultural_review' || d.publicationStatus === 'pending').length,
        avgPublicationDays: 45,
        communityConsultations: 12,
        feedbackItems: 28,
        transparencyScore: 85
      };
      
      setMetrics(mockMetrics);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadDashboardData();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await decisionTransparencyService.searchDecisions(searchQuery, {
        decisionType: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        communityId: communityId
      });
      setDecisions(searchResults);
    } catch (error) {
      console.error('Error searching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedDecision || !feedbackText.trim()) return;

    try {
      await decisionTransparencyService.addCommunityFeedback(selectedDecision.id, {
        communityId: communityId || 'public',
        communityName: 'Community Member',
        feedbackType,
        content: feedbackText,
        submittedBy: 'current_user',
        submissionMethod: 'online',
        priority: 'medium',
        status: 'received'
      });

      setFeedbackText('');
      setShowFeedbackForm(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'approved':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'consultation':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'review':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'draft':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPublicationStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'approved':
        return 'text-blue-600 bg-blue-100';
      case 'cultural_review':
        return 'text-purple-600 bg-purple-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'restricted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransparencyIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'community_restricted':
        return <Users className="w-4 h-4" />;
      case 'confidential':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return '1 month ago';
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
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
          <h1 className="text-2xl font-bold text-gray-900">Decision Transparency</h1>
          <p className="text-gray-600">
            Track government decisions, consultations, and implementation progress
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Subscribe to Updates
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalDecisions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.publishedDecisions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consultations</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.communityConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transparency Score</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.transparencyScore}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="policy">Policy</option>
            <option value="budget">Budget</option>
            <option value="program">Program</option>
            <option value="service">Service</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="emergency">Emergency</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="consultation">Consultation</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="implemented">Implemented</option>
          </select>
          
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow border text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Decisions Found</h3>
            <p className="text-gray-600">
              No decisions match your current search criteria.
            </p>
          </div>
        ) : (
          decisions.map((decision) => (
            <div
              key={decision.id}
              className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {decision.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(decision.status)}`}>
                        {decision.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPublicationStatusColor(decision.publicationStatus)}`}>
                        {decision.publicationStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{decision.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeAgo(decision.createdAt)}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        {getTransparencyIcon(decision.transparencyLevel)}
                        <span className="capitalize">{decision.transparencyLevel.replace('_', ' ')}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{decision.affectedCommunities.length} communities</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{decision.communityFeedback.length} feedback</span>
                      </span>
                      
                      {decision.resourceAllocation.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            ${decision.resourceAllocation.reduce((sum, alloc) => sum + alloc.amount, 0).toLocaleString()}
                          </span>
                        </span>
                      )}
                    </div>
                    
                    {decision.culturalImpactAssessment.culturalSensitivity !== 'low' && (
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          decision.culturalImpactAssessment.culturalSensitivity === 'critical' ? 'bg-red-100 text-red-800' :
                          decision.culturalImpactAssessment.culturalSensitivity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Cultural Sensitivity: {decision.culturalImpactAssessment.culturalSensitivity}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedDecision(decision)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {userRole !== 'public' && (
                      <button
                        onClick={() => {
                          setSelectedDecision(decision);
                          setShowFeedbackForm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Provide Feedback"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Implementation Progress */}
                {decision.implementationProgress.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Implementation Progress</span>
                      <span className="text-sm text-gray-500">
                        {decision.implementationProgress[decision.implementationProgress.length - 1]?.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${decision.implementationProgress[decision.implementationProgress.length - 1]?.progressPercentage || 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Detail Modal */}
      {selectedDecision && !showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Decision Details</h2>
                <button
                  onClick={() => setSelectedDecision(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Decision Header */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDecision.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDecision.status)}`}>
                    {selectedDecision.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{selectedDecision.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">
                      {selectedDecision.decisionType}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{selectedDecision.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedDecision.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Published:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedDecision.publishedAt?.toLocaleDateString() || 'Not published'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cultural Impact Assessment */}
              {selectedDecision.culturalImpactAssessment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Cultural Impact Assessment</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Sensitivity Level:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          selectedDecision.culturalImpactAssessment.culturalSensitivity === 'critical' ? 'bg-red-100 text-red-800' :
                          selectedDecision.culturalImpactAssessment.culturalSensitivity === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedDecision.culturalImpactAssessment.culturalSensitivity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedDecision.culturalImpactAssessment.culturalSensitivity}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Values Alignment:</span>
                        <span className="ml-2 text-gray-600">
                          {Math.round(selectedDecision.culturalImpactAssessment.communityValuesAlignment * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Elder Review:</span>
                        <span className="ml-2 text-gray-600">
                          {selectedDecision.culturalImpactAssessment.elderReviewRequired ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Approval Status:</span>
                        <span className="ml-2 text-gray-600 capitalize">
                          {selectedDecision.culturalImpactAssessment.approvalStatus}
                        </span>
                      </div>
                    </div>
                    
                    {selectedDecision.culturalImpactAssessment.elderComments && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Elder Comments:</span>
                        <p className="mt-1 text-gray-600 italic">
                          "{selectedDecision.culturalImpactAssessment.elderComments}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Allocation */}
              {selectedDecision.resourceAllocation.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Resource Allocation</h4>
                  <div className="space-y-3">
                    {selectedDecision.resourceAllocation.map((allocation) => (
                      <div key={allocation.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{allocation.description}</h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            allocation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            allocation.status === 'disbursed' ? 'bg-blue-100 text-blue-800' :
                            allocation.status === 'allocated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {allocation.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <span className="ml-2 font-medium">
                              ${allocation.amount.toLocaleString()} {allocation.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Source:</span>
                            <span className="ml-2">{allocation.source}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Timeline:</span>
                            <span className="ml-2">{allocation.timeline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Feedback */}
              {selectedDecision.communityFeedback.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Community Feedback</h4>
                  <div className="space-y-3">
                    {selectedDecision.communityFeedback.slice(0, 5).map((feedback) => (
                      <div key={feedback.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{feedback.communityName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              feedback.feedbackType === 'support' ? 'bg-green-100 text-green-800' :
                              feedback.feedbackType === 'concern' ? 'bg-red-100 text-red-800' :
                              feedback.feedbackType === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                              feedback.feedbackType === 'question' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {feedback.feedbackType}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {feedback.submittedAt.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{feedback.content}</p>
                        {feedback.response && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Response:</span> {feedback.response}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Implementation Progress */}
              {selectedDecision.implementationProgress.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Implementation Progress</h4>
                  <div className="space-y-3">
                    {selectedDecision.implementationProgress.map((progress) => (
                      <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{progress.phase}</h5>
                          <span className="text-sm text-gray-500">
                            {progress.progressPercentage}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progress.progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{progress.description}</p>
                        <div className="text-sm text-gray-500">
                          Reported by {progress.reportedBy} on {progress.reportedAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedDecision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Provide Feedback</h2>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedDecision.title}</h3>
                <p className="text-gray-600 text-sm">{selectedDecision.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Type
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="support">Support</option>
                  <option value="concern">Concern</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="question">Question</option>
                  <option value="objection">Objection</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please share your thoughts on this decision..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionTransparencyDashboard;