'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  User,
  Calendar,
  FileText,
  Mic,
  Video,
  Image,
  Shield,
  Users,
  Globe,
  Crown,
  Settings
} from 'lucide-react';

interface StoryModerationItem {
  id: string;
  storyId: string;
  story: {
    id: string;
    title: string;
    authorName: string;
    category: string;
    mediaType: string;
    culturalSafety: string;
    traditionalKnowledge: boolean;
    createdAt: Date;
  };
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  culturalReviewRequired: boolean;
  elderReviewRequired: boolean;
  technicalReviewRequired: boolean;
  estimatedReviewTime: number;
}

interface StoryModerationDashboardProps {
  userRole: 'admin' | 'elder' | 'cultural_authority' | 'technical_moderator';
  userId: string;
  communityId?: string;
}

export default function StoryModerationDashboard({
  userRole,
  userId,
  communityId
}: StoryModerationDashboardProps) {
  const [moderationQueue, setModerationQueue] = useState<StoryModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<StoryModerationItem | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [moderating, setModerating] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadModerationQueue();
  }, [userRole, communityId]);

  const loadModerationQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stories/enhanced?action=moderation-queue&moderatorType=${userRole}${communityId ? `&communityId=${communityId}` : ''}`
      );
      const result = await response.json();
      
      if (result.success) {
        setModerationQueue(result.data);
      } else {
        console.error('Failed to load moderation queue:', result.error);
      }
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (decision: 'approved' | 'rejected' | 'needs_revision') => {
    if (!selectedStory) return;

    setModerating(true);
    try {
      const response = await fetch('/api/stories/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'moderate',
          storyId: selectedStory.storyId,
          decision,
          moderatorId: userId,
          notes: moderationNotes
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove from queue and close modal
        setModerationQueue(prev => prev.filter(item => item.id !== selectedStory.id));
        setSelectedStory(null);
        setModerationNotes('');
      } else {
        console.error('Failed to moderate story:', result.error);
      }
    } catch (error) {
      console.error('Error moderating story:', error);
    } finally {
      setModerating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      medium: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      high: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const { color, icon: Icon } = config[priority as keyof typeof config] || config.medium;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'audio': return Mic;
      case 'video': return Video;
      case 'multimedia': return Image;
      default: return FileText;
    }
  };

  const getCulturalSafetyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'community': return Users;
      case 'restricted': return Shield;
      case 'sacred': return AlertTriangle;
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

  const getReviewRequirements = (item: StoryModerationItem) => {
    const requirements = [];
    if (item.culturalReviewRequired) requirements.push('Cultural Review');
    if (item.elderReviewRequired) requirements.push('Elder Review');
    if (item.technicalReviewRequired) requirements.push('Technical Review');
    return requirements;
  };

  const canModerate = (item: StoryModerationItem) => {
    switch (userRole) {
      case 'admin':
        return true;
      case 'elder':
        return item.elderReviewRequired;
      case 'cultural_authority':
        return item.culturalReviewRequired;
      case 'technical_moderator':
        return item.technicalReviewRequired;
      default:
        return false;
    }
  };

  const filteredQueue = moderationQueue.filter(item => {
    if (activeTab === 'pending') {
      return canModerate(item);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading moderation queue...</p>
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
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            Story Moderation Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Review and moderate community stories ({userRole.replace('_', ' ')})
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {filteredQueue.length} items in queue
          </Badge>
          <Button
            variant="outline"
            onClick={loadModerationQueue}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Queue</p>
                <p className="text-2xl font-bold text-gray-900">{moderationQueue.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {moderationQueue.filter(item => item.priority === 'high' || item.priority === 'urgent').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Elder Review</p>
                <p className="text-2xl font-bold text-purple-600">
                  {moderationQueue.filter(item => item.elderReviewRequired).length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cultural Review</p>
                <p className="text-2xl font-bold text-red-600">
                  {moderationQueue.filter(item => item.culturalReviewRequired).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">My Queue ({filteredQueue.length})</TabsTrigger>
          <TabsTrigger value="all">All Items ({moderationQueue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredQueue.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items in your queue
                </h3>
                <p className="text-gray-600">
                  All stories requiring your review have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.story.title}
                          </h3>
                          {getPriorityBadge(item.priority)}
                          {item.story.traditionalKnowledge && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Traditional Knowledge
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span>{item.story.authorName}</span>
                          </div>
                          <div className="flex items-center">
                            {React.createElement(getMediaTypeIcon(item.story.mediaType), { 
                              className: "w-4 h-4 mr-2" 
                            })}
                            <span className="capitalize">{item.story.mediaType}</span>
                          </div>
                          <div className="flex items-center">
                            {React.createElement(getCulturalSafetyIcon(item.story.culturalSafety), { 
                              className: `w-4 h-4 mr-2 ${getCulturalSafetyColor(item.story.culturalSafety)}` 
                            })}
                            <span className="capitalize">{item.story.culturalSafety}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{item.submittedAt.toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">
                            Category: <span className="font-medium">{item.story.category}</span>
                          </span>
                          <span className="text-gray-500">
                            Est. Review Time: <span className="font-medium">{item.estimatedReviewTime} min</span>
                          </span>
                        </div>

                        {getReviewRequirements(item).length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 mb-2">Required Reviews:</p>
                            <div className="flex flex-wrap gap-2">
                              {getReviewRequirements(item).map((requirement) => (
                                <Badge key={requirement} variant="outline" className="text-xs">
                                  {requirement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStory(item)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {moderationQueue.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.story.title}
                        </h3>
                        {getPriorityBadge(item.priority)}
                        {!canModerate(item) && (
                          <Badge variant="outline" className="text-gray-500">
                            Not in your queue
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{item.story.authorName}</span>
                        </div>
                        <div className="flex items-center">
                          {React.createElement(getMediaTypeIcon(item.story.mediaType), { 
                            className: "w-4 h-4 mr-2" 
                          })}
                          <span className="capitalize">{item.story.mediaType}</span>
                        </div>
                        <div className="flex items-center">
                          {React.createElement(getCulturalSafetyIcon(item.story.culturalSafety), { 
                            className: `w-4 h-4 mr-2 ${getCulturalSafetyColor(item.story.culturalSafety)}` 
                          })}
                          <span className="capitalize">{item.story.culturalSafety}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{item.submittedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      {getReviewRequirements(item).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {getReviewRequirements(item).map((requirement) => (
                            <Badge key={requirement} variant="outline" className="text-xs">
                              {requirement}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStory(item)}
                        disabled={!canModerate(item)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {canModerate(item) ? 'Review' : 'View'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Story Review Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Review Story: {selectedStory.story.title}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    {getPriorityBadge(selectedStory.priority)}
                    <Badge className={`${getCulturalSafetyColor(selectedStory.story.culturalSafety)}`}>
                      {selectedStory.story.culturalSafety}
                    </Badge>
                    {selectedStory.story.traditionalKnowledge && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Traditional Knowledge
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStory(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Story Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Author:</p>
                    <p className="text-gray-600">{selectedStory.story.authorName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Category:</p>
                    <p className="text-gray-600">{selectedStory.story.category}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Media Type:</p>
                    <p className="text-gray-600 capitalize">{selectedStory.story.mediaType}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submitted:</p>
                    <p className="text-gray-600">{selectedStory.submittedAt.toLocaleString()}</p>
                  </div>
                </div>

                {/* Review Requirements */}
                {getReviewRequirements(selectedStory).length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Review Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {getReviewRequirements(selectedStory).map((requirement) => (
                        <Badge key={requirement} variant="outline">
                          {requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderation Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moderation Notes
                  </label>
                  <Textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                {canModerate(selectedStory) && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleModeration('needs_revision')}
                      disabled={moderating}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Needs Revision
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleModeration('rejected')}
                      disabled={moderating}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleModeration('approved')}
                      disabled={moderating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {moderating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}