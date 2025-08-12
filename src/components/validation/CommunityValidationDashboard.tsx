'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Star, 
  Eye,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Plus,
  UserCheck,
  Award,
  Target,
  Calendar,
  FileText,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { communityValidationService, ValidationRequest, CommunityValidator } from '../../lib/community-validation-service';

interface CommunityValidationDashboardProps {
  communityId?: string;
  userRole?: 'validator' | 'admin' | 'submitter' | 'viewer';
  userId?: string;
}

interface ValidationMetrics {
  totalRequests: number;
  pendingValidations: number;
  completedValidations: number;
  consensusRate: number;
  averageConfidence: number;
  activeValidators: number;
  overdueRequests: number;
  culturalComplianceScore: number;
}

const CommunityValidationDashboard: React.FC<CommunityValidationDashboardProps> = ({
  communityId,
  userRole = 'viewer',
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'validators' | 'metrics' | 'feedback'>('requests');
  const [validationRequests, setValidationRequests] = useState<ValidationRequest[]>([]);
  const [validators, setValidators] = useState<CommunityValidator[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null);
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Validation form state
  const [validationForm, setValidationForm] = useState({
    validationScore: 3,
    accuracy: 3,
    relevance: 3,
    culturalAppropriateness: 3,
    completeness: 3,
    actionability: 3,
    overallAssessment: 'neutral' as const,
    comments: '',
    specificConcerns: [] as string[],
    suggestedImprovements: [] as string[],
    culturalConsiderations: [] as string[],
    confidenceLevel: 0.7
  });

  useEffect(() => {
    loadDashboardData();
  }, [communityId, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load validation requests
      if (activeTab === 'requests') {
        // Mock data for now - would come from API
        const mockRequests: ValidationRequest[] = [
          {
            id: 'validation-001',
            contentId: 'ai-insight-001',
            contentType: 'ai_insight',
            content: {
              title: 'Community Health Trends Analysis',
              description: 'AI analysis of community health patterns',
              aiGeneratedInsight: 'Analysis shows 15% increase in mental health concerns among youth',
              supportingData: ['health_clinic_records', 'community_surveys'],
              methodology: 'Machine learning analysis of health service utilization',
              assumptions: ['Data completeness', 'Consistent reporting'],
              limitations: ['Limited sample size', 'Seasonal variations'],
              culturalContext: 'Traditional healing practices important for mental wellness',
              potentialImpact: 'Could inform culturally appropriate mental health programs',
              recommendedActions: ['Integrate traditional healing', 'Increase winter programming']
            },
            submittedBy: 'ai-system',
            submittedAt: new Date('2024-01-15'),
            priority: 'high',
            communityId: communityId || 'community-1',
            communityName: 'Bearcloud First Nation',
            requiredValidators: 3,
            currentValidators: 2,
            status: 'in_review',
            culturalSensitivity: 'high',
            traditionalKnowledgeInvolved: true,
            elderReviewRequired: true,
            validations: [],
            consensusReached: false,
            finalScore: 0,
            confidence: 0,
            sourceAttribution: [],
            feedback: [],
            revisions: []
          }
        ];
        setValidationRequests(mockRequests);
      }
      
      // Load metrics
      const mockMetrics: ValidationMetrics = {
        totalRequests: 25,
        pendingValidations: 8,
        completedValidations: 17,
        consensusRate: 0.85,
        averageConfidence: 0.78,
        activeValidators: 12,
        overdueRequests: 2,
        culturalComplianceScore: 88
      };
      setMetrics(mockMetrics);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitValidation = async () => {
    if (!selectedRequest) return;

    try {
      const validation = {
        validatorId: userId || 'current-user',
        validatorName: 'Current User',
        validatorRole: 'community_expert' as const,
        validatorExpertise: ['community_knowledge'],
        ...validationForm,
        timeSpentMinutes: 45
      };

      await communityValidationService.submitValidation(selectedRequest.id, validation);
      
      // Reset form
      setValidationForm({
        validationScore: 3,
        accuracy: 3,
        relevance: 3,
        culturalAppropriateness: 3,
        completeness: 3,
        actionability: 3,
        overallAssessment: 'neutral',
        comments: '',
        specificConcerns: [],
        suggestedImprovements: [],
        culturalConsiderations: [],
        confidenceLevel: 0.7
      });
      
      setShowValidationForm(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error submitting validation:', error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_review':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_revision':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
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

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'none':
        return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-2xl font-bold text-gray-900">Community Validation</h1>
          <p className="text-gray-600">
            Review and validate AI-generated insights with community expertise
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {userRole === 'admin' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Validator</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.pendingValidations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consensus Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(metrics.consensusRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cultural Compliance</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.culturalComplianceScore}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'requests', label: 'Validation Requests', icon: FileText },
            { id: 'validators', label: 'Community Validators', icon: Users },
            { id: 'metrics', label: 'Performance Metrics', icon: BarChart3 },
            { id: 'feedback', label: 'Model Feedback', icon: Lightbulb }
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
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search validation requests..."
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
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="validated">Validated</option>
                <option value="needs_revision">Needs Revision</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Validation Requests List */}
          <div className="space-y-4">
            {validationRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow border text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Requests</h3>
                <p className="text-gray-600">
                  No validation requests match your current filters.
                </p>
              </div>
            ) : (
              validationRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.content.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{request.content.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTimeAgo(request.submittedAt)}</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{request.currentValidators}/{request.requiredValidators} validators</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{(request.confidence * 100).toFixed(0)}% confidence</span>
                          </span>
                          
                          <span className="capitalize">{request.contentType.replace('_', ' ')}</span>
                        </div>
                        
                        <div className="mt-3 flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSensitivityColor(request.culturalSensitivity)}`}>
                            Cultural Sensitivity: {request.culturalSensitivity}
                          </span>
                          
                          {request.traditionalKnowledgeInvolved && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <Star className="w-3 h-3 mr-1" />
                              Traditional Knowledge
                            </span>
                          )}
                          
                          {request.elderReviewRequired && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Elder Review Required
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {userRole === 'validator' && request.status === 'in_review' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowValidationForm(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Validate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Validation Form Modal */}
      {showValidationForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Validate Content</h2>
                <button
                  onClick={() => setShowValidationForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Content Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedRequest.content.title}</h3>
                <p className="text-gray-700 mb-3">{selectedRequest.content.description}</p>
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-900 mb-2">AI-Generated Insight:</h4>
                  <p className="text-gray-800">{selectedRequest.content.aiGeneratedInsight}</p>
                </div>
              </div>

              {/* Validation Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'validationScore', label: 'Overall Validation Score', description: 'How well does this insight align with your knowledge?' },
                  { key: 'accuracy', label: 'Accuracy', description: 'How accurate is the information presented?' },
                  { key: 'relevance', label: 'Relevance', description: 'How relevant is this insight to the community?' },
                  { key: 'culturalAppropriateness', label: 'Cultural Appropriateness', description: 'How culturally appropriate is this insight?' },
                  { key: 'completeness', label: 'Completeness', description: 'How complete is the analysis?' },
                  { key: 'actionability', label: 'Actionability', description: 'How actionable are the recommendations?' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">1</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={validationForm[field.key as keyof typeof validationForm] as number}
                        onChange={(e) => setValidationForm({
                          ...validationForm,
                          [field.key]: parseFloat(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">5</span>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {(validationForm[field.key as keyof typeof validationForm] as number).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Assessment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Assessment
                </label>
                <select
                  value={validationForm.overallAssessment}
                  onChange={(e) => setValidationForm({ ...validationForm, overallAssessment: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="strongly_disagree">Strongly Disagree</option>
                  <option value="disagree">Disagree</option>
                  <option value="neutral">Neutral</option>
                  <option value="agree">Agree</option>
                  <option value="strongly_agree">Strongly Agree</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments and Feedback
                </label>
                <textarea
                  value={validationForm.comments}
                  onChange={(e) => setValidationForm({ ...validationForm, comments: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide detailed feedback about this insight..."
                />
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Confidence Level
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Low</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={validationForm.confidenceLevel}
                    onChange={(e) => setValidationForm({ ...validationForm, confidenceLevel: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">High</span>
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {(validationForm.confidenceLevel * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  onClick={() => setShowValidationForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitValidation}
                  disabled={!validationForm.comments.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Validation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityValidationDashboard;