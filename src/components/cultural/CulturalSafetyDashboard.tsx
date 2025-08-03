'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Star,
  Flag,
  UserCheck,
  Settings,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ModerationItem {
  id: string;
  contentId: string;
  contentType: string;
  submittedBy: string;
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  culturalFlags: string[];
  automaticFlags: string[];
  assignedModerator: string;
  estimatedReviewTime: number;
  status: 'queued' | 'in_review' | 'completed';
  content?: string;
  safetyLevel?: string;
}

interface ElderReview {
  id: string;
  contentId: string;
  elderName: string;
  elderRole: string;
  reviewDecision: 'approve' | 'reject' | 'modify' | 'escalate';
  culturalConcerns: string[];
  recommendations: string[];
  protocolViolations: string[];
  reviewDate: Date;
  status: 'pending' | 'completed';
}

interface CulturalProtocol {
  id: string;
  protocolName: string;
  protocolType: string;
  description: string;
  applicableContent: string[];
  restrictions: string[];
  requiredApprovals: string[];
  isActive: boolean;
}

interface CulturalSafetyDashboardProps {
  userRole: 'moderator' | 'elder' | 'cultural_authority' | 'admin';
  userId: string;
  communityId?: string;
}

export default function CulturalSafetyDashboard({ 
  userRole, 
  userId, 
  communityId 
}: CulturalSafetyDashboardProps) {
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [elderReviews, setElderReviews] = useState<ElderReview[]>([]);
  const [protocols, setProtocols] = useState<CulturalProtocol[]>([]);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<string>('');
  const [safetyLevel, setSafetyLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary stats
  const [stats, setStats] = useState({
    pendingReviews: 0,
    urgentItems: 0,
    elderReviewsNeeded: 0,
    averageReviewTime: 0,
    protocolViolations: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [userId, communityId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [queueRes, elderRes, protocolsRes, statsRes] = await Promise.all([
        fetch(`/api/cultural/moderation-queue?moderatorId=${userId}${communityId ? `&communityId=${communityId}` : ''}`),
        fetch(`/api/cultural/elder-reviews?userId=${userId}${communityId ? `&communityId=${communityId}` : ''}`),
        fetch(`/api/cultural/protocols${communityId ? `?communityId=${communityId}` : ''}`),
        fetch(`/api/cultural/stats?userId=${userId}${communityId ? `&communityId=${communityId}` : ''}`)
      ]);

      if (queueRes.ok) {
        const data = await queueRes.json();
        setModerationQueue(data.queue || []);
      }

      if (elderRes.ok) {
        const data = await elderRes.json();
        setElderReviews(data.reviews || []);
      }

      if (protocolsRes.ok) {
        const data = await protocolsRes.json();
        setProtocols(data.protocols || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedItem || !reviewDecision || !reviewNotes.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/cultural/complete-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedItem.id,
          decision: reviewDecision,
          reviewNotes: reviewNotes,
          reviewedBy: userId,
          culturalSafetyLevel: safetyLevel
        })
      });

      if (response.ok) {
        // Refresh data and clear form
        await loadDashboardData();
        setSelectedItem(null);
        setReviewNotes('');
        setReviewDecision('');
        setSafetyLevel('');
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case 'sacred': return 'text-purple-600 bg-purple-100';
      case 'restricted': return 'text-red-600 bg-red-100';
      case 'community': return 'text-blue-600 bg-blue-100';
      case 'public': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'story': return <MessageSquare className="h-4 w-4" />;
      case 'insight': return <Star className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
            Cultural Safety Dashboard
          </h1>
          <p className="text-gray-600">
            Manage cultural protocols and content moderation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Protocols
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingReviews}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.urgentItems}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Elder Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.elderReviewsNeeded}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageReviewTime}h
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Protocol Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.protocolViolations}
                </p>
              </div>
              <Flag className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="moderation">Moderation Queue</TabsTrigger>
          <TabsTrigger value="elder">Elder Reviews</TabsTrigger>
          <TabsTrigger value="protocols">Cultural Protocols</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue List */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getContentTypeIcon(item.contentType)}
                          <div>
                            <p className="font-medium text-sm">{item.contentType}</p>
                            <p className="text-xs text-gray-600">by {item.submittedBy}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {item.estimatedReviewTime}h
                          </span>
                        </div>
                      </div>
                      
                      {item.culturalFlags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {item.culturalFlags.slice(0, 2).map((flag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {flag}
                              </Badge>
                            ))}
                            {item.culturalFlags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.culturalFlags.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Review Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Review Content</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItem ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Content Details</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          {getContentTypeIcon(selectedItem.contentType)}
                          <span className="font-medium">{selectedItem.contentType}</span>
                          <Badge className={getPriorityColor(selectedItem.priority)}>
                            {selectedItem.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Submitted by {selectedItem.submittedBy} on{' '}
                          {selectedItem.submittedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cultural Flags</h4>
                      <div className="space-y-2">
                        {selectedItem.culturalFlags.map((flag, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Flag className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Review Decision</h4>
                      <Select value={reviewDecision} onValueChange={setReviewDecision}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                          <SelectItem value="needs_revision">Needs Revision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cultural Safety Level</h4>
                      <Select value={safetyLevel} onValueChange={setSafetyLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select safety level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                          <SelectItem value="sacred">Sacred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Review Notes</h4>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide detailed review notes..."
                        rows={4}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleReviewSubmit}
                        disabled={!reviewDecision || !reviewNotes.trim()}
                        className="flex-1"
                      >
                        Submit Review
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(null);
                          setReviewNotes('');
                          setReviewDecision('');
                          setSafetyLevel('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select an item from the queue to review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="elder" className="space-y-4">
          <div className="grid gap-4">
            {elderReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Elder Review Request</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {review.elderName} - {review.elderRole}
                      </p>
                    </div>
                    <Badge className={review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                      {review.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cultural Concerns</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {review.culturalConcerns.map((concern, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {review.status === 'completed' && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Elder Decision</h4>
                          <Badge className={
                            review.reviewDecision === 'approve' ? 'bg-green-100 text-green-800' :
                            review.reviewDecision === 'reject' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {review.reviewDecision}
                          </Badge>
                        </div>

                        {review.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {review.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-sm text-gray-500">
                      Review Date: {review.reviewDate.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{protocol.protocolName}</CardTitle>
                      <Badge variant="outline">{protocol.protocolType}</Badge>
                    </div>
                    <Badge className={protocol.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {protocol.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">{protocol.description}</p>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Applicable Content</h4>
                      <div className="flex flex-wrap gap-1">
                        {protocol.applicableContent.map((content, i) => (
                          <Badge key={i} variant="secondary">{content}</Badge>
                        ))}
                      </div>
                    </div>

                    {protocol.restrictions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Restrictions</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {protocol.restrictions.map((restriction, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <Shield className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{restriction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {protocol.requiredApprovals.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Approvals</h4>
                        <div className="flex flex-wrap gap-1">
                          {protocol.requiredApprovals.map((approval, i) => (
                            <Badge key={i} variant="outline">{approval}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Analytics charts would be implemented here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Safety Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Public</span>
                    <Badge className="bg-green-100 text-green-800">45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Community</span>
                    <Badge className="bg-blue-100 text-blue-800">30%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Restricted</span>
                    <Badge className="bg-red-100 text-red-800">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sacred</span>
                    <Badge className="bg-purple-100 text-purple-800">5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}