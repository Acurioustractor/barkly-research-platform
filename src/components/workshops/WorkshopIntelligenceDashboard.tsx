'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  Lightbulb,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Crown,
  Clock,
  BarChart3,
  RefreshCw,
  Download,
  Share2,
  Eye,
  ArrowRight,
  Zap,
  Globe,
  Shield,
  MessageSquare,
  FileText,
  Calendar
} from 'lucide-react';

interface WorkshopInsight {
  id: string;
  insightType: 'community_need' | 'service_gap' | 'success_pattern' | 'cultural_knowledge' | 'action_item';
  title: string;
  description: string;
  evidence: string[];
  themes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  stakeholders: string[];
  confidence: number;
  followUpRequired: boolean;
}

interface WorkshopIntelligenceReport {
  eventId: string;
  eventTitle: string;
  sessionCount: number;
  totalCaptures: number;
  processedInsights: number;
  communityNeeds: WorkshopInsight[];
  serviceGaps: WorkshopInsight[];
  successPatterns: WorkshopInsight[];
  culturalKnowledge: WorkshopInsight[];
  actionItems: WorkshopInsight[];
  keyThemes: { theme: string; frequency: number; priority: string }[];
  stakeholderMap: { stakeholder: string; involvement: string[]; priority: string }[];
  followUpActions: { action: string; assignee?: string; priority: string }[];
  culturalConsiderations: string[];
  recommendedNextSteps: string[];
  generatedAt: Date;
}

interface WorkshopIntelligenceDashboardProps {
  eventId: string;
  eventTitle: string;
  userRole: 'admin' | 'facilitator' | 'community_member';
}

export default function WorkshopIntelligenceDashboard({
  eventId,
  eventTitle,
  userRole
}: WorkshopIntelligenceDashboardProps) {
  const [report, setReport] = useState<WorkshopIntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadWorkshopIntelligence();
  }, [eventId]);

  const loadWorkshopIntelligence = async () => {
    setLoading(true);
    try {
      // First get summary to check if report exists
      const summaryResponse = await fetch(`/api/workshops/intelligence?action=summary&eventId=${eventId}`);
      const summaryResult = await summaryResponse.json();
      
      if (summaryResult.success) {
        setSummary(summaryResult.data);
        
        // If report exists, load it
        if (summaryResult.data.hasReport) {
          const reportResponse = await fetch(`/api/workshops/intelligence?action=report&eventId=${eventId}`);
          const reportResult = await reportResponse.json();
          
          if (reportResult.success) {
            setReport({
              ...reportResult.data,
              generatedAt: new Date(reportResult.data.generatedAt)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading workshop intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWorkshopIntelligence = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/workshops/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process',
          eventId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReport({
          ...result.data,
          generatedAt: new Date(result.data.generatedAt)
        });
        
        // Update community intelligence
        await fetch('/api/workshops/intelligence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_community_intelligence',
            eventId
          }),
        });
        
        await loadWorkshopIntelligence();
      } else {
        throw new Error(result.error || 'Failed to process workshop intelligence');
      }
    } catch (error) {
      console.error('Error processing workshop intelligence:', error);
      alert('Failed to process workshop intelligence. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'community_need': return AlertTriangle;
      case 'service_gap': return Target;
      case 'success_pattern': return CheckCircle;
      case 'cultural_knowledge': return Crown;
      case 'action_item': return Clock;
      default: return Lightbulb;
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'community_need': return 'text-red-600 bg-red-100';
      case 'service_gap': return 'text-orange-600 bg-orange-100';
      case 'success_pattern': return 'text-green-600 bg-green-100';
      case 'cultural_knowledge': return 'text-purple-600 bg-purple-100';
      case 'action_item': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
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

  const renderInsightCard = (insight: WorkshopInsight) => {
    const Icon = getInsightTypeIcon(insight.insightType);
    const CulturalIcon = getCulturalSafetyIcon(insight.culturalSafety);
    
    return (
      <Card key={insight.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-gray-900 line-clamp-1">{insight.title}</h4>
            </div>
            <div className="flex items-center space-x-1">
              <Badge className={getPriorityColor(insight.priority)}>
                {insight.priority}
              </Badge>
              <CulturalIcon className="w-3 h-3 text-gray-500" />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {insight.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
              {insight.stakeholders.length > 0 && (
                <span>• {insight.stakeholders.length} stakeholder{insight.stakeholders.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {insight.followUpRequired && (
              <Badge variant="outline" className="text-xs">
                Follow-up required
              </Badge>
            )}
          </div>
          
          {insight.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.themes.slice(0, 3).map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {insight.themes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{insight.themes.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading workshop intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            Workshop Intelligence
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered insights from {eventTitle}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!report && summary?.totalInsights === 0 && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-yellow-800 mb-2">
                No knowledge captures found for this workshop
              </p>
              <p className="text-xs text-yellow-600">
                Use the facilitation tools to capture insights during the workshop
              </p>
            </div>
          )}
          
          {summary?.totalInsights > 0 && !report && (
            <Button 
              onClick={processWorkshopIntelligence}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Intelligence
                </>
              )}
            </Button>
          )}
          
          {report && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={processWorkshopIntelligence}
                disabled={processing}
                variant="outline" 
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
                Reprocess
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Insights</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalInsights}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Community Needs</p>
                  <p className="text-2xl font-bold text-red-600">{summary.insightsByType.community_need}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Service Gaps</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.insightsByType.service_gap}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Patterns</p>
                  <p className="text-2xl font-bold text-green-600">{summary.insightsByType.success_pattern}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cultural Knowledge</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.insightsByType.cultural_knowledge}</p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {report ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="needs">Needs ({report.communityNeeds.length})</TabsTrigger>
            <TabsTrigger value="gaps">Gaps ({report.serviceGaps.length})</TabsTrigger>
            <TabsTrigger value="patterns">Patterns ({report.successPatterns.length})</TabsTrigger>
            <TabsTrigger value="cultural">Cultural ({report.culturalKnowledge.length})</TabsTrigger>
            <TabsTrigger value="actions">Actions ({report.actionItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Themes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Key Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.keyThemes.slice(0, 8).map((theme, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{theme.theme}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{theme.frequency}</Badge>
                        <Badge className={getPriorityColor(theme.priority)}>
                          {theme.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Key Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.stakeholderMap.slice(0, 9).map((stakeholder, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{stakeholder.stakeholder}</h4>
                        <Badge className={getPriorityColor(stakeholder.priority)}>
                          {stakeholder.priority}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {stakeholder.involvement.slice(0, 3).map((involvement, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {involvement.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendedNextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-900 flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cultural Considerations */}
            {report.culturalConsiderations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2" />
                    Cultural Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.culturalConsiderations.map((consideration, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-purple-50 rounded">
                        <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                        <p className="text-sm text-purple-900">{consideration}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="needs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.communityNeeds.map(renderInsightCard)}
            </div>
            {report.communityNeeds.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No community needs identified in this workshop</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gaps" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.serviceGaps.map(renderInsightCard)}
            </div>
            {report.serviceGaps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No service gaps identified in this workshop</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.successPatterns.map(renderInsightCard)}
            </div>
            {report.successPatterns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No success patterns identified in this workshop</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cultural" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.culturalKnowledge.map(renderInsightCard)}
            </div>
            {report.culturalKnowledge.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Crown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cultural knowledge captured in this workshop</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.actionItems.map(renderInsightCard)}
            </div>
            {report.actionItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No action items identified in this workshop</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : summary?.totalInsights > 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to Generate Intelligence
            </h3>
            <p className="text-gray-600 mb-4">
              {summary.totalInsights} knowledge captures are ready to be processed into actionable insights.
            </p>
            <Button 
              onClick={processWorkshopIntelligence}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing Intelligence...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Workshop Intelligence
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Workshop Content Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Use the workshop facilitation tools to capture knowledge, insights, and discussions during your workshop.
            </p>
            <div className="flex justify-center space-x-2">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Facilitation Tools
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Back to Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Metadata */}
      {report && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Report generated: {report.generatedAt.toLocaleString()}</span>
                <span>•</span>
                <span>{report.sessionCount} session{report.sessionCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{report.totalCaptures} capture{report.totalCaptures !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">AI Processed</Badge>
                <Badge variant="outline">v1.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}