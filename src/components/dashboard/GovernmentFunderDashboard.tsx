'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Clock,
  Lightbulb
} from 'lucide-react';

interface InvestmentRecommendation {
  id: string;
  priority: number;
  investment: string;
  expectedROI: number;
  communities: string[];
  evidence: string[];
  timeline: string;
  estimatedCost: number;
  potentialImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
}

interface ProgramMetrics {
  id: string;
  programName: string;
  effectiveness: number;
  reach: number;
  satisfaction: number;
  outcomes: string[];
  challenges: string[];
  recommendations: string[];
}

interface CommunityFeedback {
  id: string;
  community: string;
  feedback: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sentiment: 'positive' | 'neutral' | 'negative';
  date: Date;
  status: 'new' | 'reviewed' | 'addressed';
}

interface TrendAnalysis {
  id: string;
  trend: string;
  direction: 'improving' | 'stable' | 'declining';
  strength: number;
  communities: string[];
  implications: string[];
  recommendations: string[];
}

interface GovernmentFunderDashboardProps {
  userRole: 'government' | 'funder';
  region?: string;
}

export default function GovernmentFunderDashboard({ 
  userRole, 
  region 
}: GovernmentFunderDashboardProps) {
  const [investmentRecommendations, setInvestmentRecommendations] = useState<InvestmentRecommendation[]>([]);
  const [programMetrics, setProgramMetrics] = useState<ProgramMetrics[]>([]);
  const [communityFeedback, setCommunityFeedback] = useState<CommunityFeedback[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalInvestment: 0,
    activePrograms: 0,
    communitiesServed: 0,
    averageROI: 0,
    pendingFeedback: 0,
    emergingIssues: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [region]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all dashboard data in parallel
      const [
        recommendationsRes,
        metricsRes,
        feedbackRes,
        trendsRes,
        summaryRes
      ] = await Promise.all([
        fetch(`/api/government/investment-recommendations${region ? `?region=${region}` : ''}`),
        fetch(`/api/government/program-metrics${region ? `?region=${region}` : ''}`),
        fetch(`/api/government/community-feedback${region ? `?region=${region}` : ''}`),
        fetch(`/api/government/trend-analysis${region ? `?region=${region}` : ''}`),
        fetch(`/api/government/summary-metrics${region ? `?region=${region}` : ''}`)
      ]);

      if (recommendationsRes.ok) {
        const data = await recommendationsRes.json();
        setInvestmentRecommendations(data.recommendations || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setProgramMetrics(data.metrics || []);
      }

      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setCommunityFeedback(data.feedback || []);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrendAnalysis(data.trends || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummaryMetrics(data.summary || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 6) return 'text-orange-600 bg-orange-100';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
            {userRole === 'government' ? 'Government Dashboard' : 'Funder Dashboard'}
          </h1>
          <p className="text-gray-600">
            Strategic insights and investment recommendations for community development
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summaryMetrics.totalInvestment.toLocaleString()}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Programs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.activePrograms}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Communities Served</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.communitiesServed}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average ROI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.averageROI}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Investment Recommendations</TabsTrigger>
          <TabsTrigger value="impact">Impact Measurement</TabsTrigger>
          <TabsTrigger value="feedback">Community Voice</TabsTrigger>
          <TabsTrigger value="trends">Strategic Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Priority Investment Recommendations</h2>
            <Button variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              Generate New Recommendations
            </Button>
          </div>
          
          <div className="grid gap-4">
            {investmentRecommendations.slice(0, 6).map((recommendation) => (
              <Card key={recommendation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{recommendation.investment}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          Priority {recommendation.priority}/10
                        </Badge>
                        <Badge className={getRiskColor(recommendation.riskLevel)}>
                          {recommendation.riskLevel} risk
                        </Badge>
                        <Badge variant="outline">{recommendation.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {recommendation.expectedROI}% ROI
                      </div>
                      <div className="text-sm text-gray-600">
                        ${recommendation.estimatedCost.toLocaleString()}K
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Target Communities</h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.communities.map((community, i) => (
                          <Badge key={i} variant="outline">{community}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{recommendation.timeline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Supporting Evidence</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recommendation.evidence.slice(0, 3).map((evidence, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Potential Impact: {recommendation.potentialImpact}/10
                      </div>
                      <Button size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Program Impact Measurement</h2>
            <Button variant="outline" size="sm">
              <PieChart className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programMetrics.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{program.programName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {program.effectiveness}%
                        </div>
                        <div className="text-sm text-gray-600">Effectiveness</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {program.reach.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">People Reached</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {program.satisfaction}%
                        </div>
                        <div className="text-sm text-gray-600">Satisfaction</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Outcomes</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {program.outcomes.slice(0, 3).map((outcome, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {program.challenges.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Challenges</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {program.challenges.slice(0, 2).map((challenge, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Community Voice & Feedback</h2>
            <div className="flex space-x-2">
              <Badge variant="outline">
                {summaryMetrics.pendingFeedback} pending review
              </Badge>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Feedback
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {communityFeedback.slice(0, 8).map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{feedback.community}</Badge>
                        <Badge className={getSentimentColor(feedback.sentiment)}>
                          {feedback.sentiment}
                        </Badge>
                        <Badge variant="secondary">{feedback.category}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{feedback.feedback}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(feedback.date).toLocaleDateString()}</span>
                        <span>Status: {feedback.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={
                        feedback.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        feedback.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {feedback.priority}
                      </Badge>
                      
                      {feedback.status === 'new' && (
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Strategic Planning & Trends</h2>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Button>
          </div>
          
          <div className="grid gap-4">
            {trendAnalysis.map((trend) => (
              <Card key={trend.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      {getTrendIcon(trend.direction)}
                      <span>{trend.trend}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600">
                        Strength: {trend.strength}/10
                      </div>
                      <Progress value={trend.strength * 10} className="w-20" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Affected Communities</h4>
                      <div className="flex flex-wrap gap-1">
                        {trend.communities.map((community, i) => (
                          <Badge key={i} variant="outline">{community}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Strategic Implications</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {trend.implications.slice(0, 3).map((implication, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{implication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {trend.recommendations.slice(0, 2).map((recommendation, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}