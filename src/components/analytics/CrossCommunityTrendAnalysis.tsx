'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  MapPin, 
  Calendar,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Network,
  Filter
} from 'lucide-react';
import {
  TrendAnalysis,
  TrendInsight,
  IdentifiedPattern,
  TrendRecommendation
} from '@/lib/cross-community-trend-analysis';

interface CrossCommunityTrendAnalysisProps {
  className?: string;
}

export default function CrossCommunityTrendAnalysis({
  className = ''
}: CrossCommunityTrendAnalysisProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<TrendAnalysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<TrendAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<TrendAnalysis['analysisType']>('community_health');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TrendAnalysis['timeframe']>('monthly');
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  useEffect(() => {
    loadRecentAnalyses();
  }, []);

  const loadRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/analytics/cross-community-trends?action=get-recent&limit=5');
      const data = await response.json();
      
      if (response.ok) {
        setRecentAnalyses(data.analyses || []);
        if (data.analyses && data.analyses.length > 0) {
          setCurrentAnalysis(data.analyses[0]);
        }
      }
    } catch (error) {
      console.error('Error loading recent analyses:', error);
    }
  };

  const performNewAnalysis = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/analytics/cross-community-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'perform-analysis',
          analysisType: selectedAnalysisType,
          timeframe: selectedTimeframe,
          communityIds: selectedCommunities.length > 0 ? selectedCommunities : undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentAnalysis(data.analysis);
        await loadRecentAnalyses();
      } else {
        console.error('Error performing analysis:', data.error);
      }
    } catch (error) {
      console.error('Error performing analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: TrendInsight['type']) => {
    switch (type) {
      case 'positive_trend':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative_trend':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'emerging_pattern':
        return <Network className="h-4 w-4 text-blue-500" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'correlation':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
    }
  };

  const getInsightColor = (type: TrendInsight['type']) => {
    switch (type) {
      case 'positive_trend':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative_trend':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'emerging_pattern':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'anomaly':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'correlation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'weak':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cross-Community Trend Analysis</h2>
          <p className="text-gray-600">
            Identify patterns, service effectiveness, and emerging needs across communities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={performNewAnalysis}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Analyzing...' : 'New Analysis'}
          </Button>
        </div>
      </div>

      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <Select
                value={selectedAnalysisType}
                onValueChange={(value: any) => setSelectedAnalysisType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community_health">Community Health</SelectItem>
                  <SelectItem value="service_effectiveness">Service Effectiveness</SelectItem>
                  <SelectItem value="emerging_needs">Emerging Needs</SelectItem>
                  <SelectItem value="cultural_patterns">Cultural Patterns</SelectItem>
                  <SelectItem value="resource_allocation">Resource Allocation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select
                value={selectedTimeframe}
                onValueChange={(value: any) => setSelectedTimeframe(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Communities</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  <SelectItem value="selected">Selected Communities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>   
   {/* Current Analysis */}
      {currentAnalysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Analysis Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Communities</p>
                      <p className="text-2xl font-bold">{currentAnalysis.communities.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Insights</p>
                      <p className="text-2xl font-bold">{currentAnalysis.insights.length}</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Patterns</p>
                      <p className="text-2xl font-bold">{currentAnalysis.patterns.length}</p>
                    </div>
                    <Network className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-2xl font-bold">{formatConfidence(currentAnalysis.confidence)}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <Progress value={currentAnalysis.confidence * 100} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Analysis Details */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <Badge className="ml-2 capitalize">
                      {currentAnalysis.analysisType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Timeframe:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {currentAnalysis.timeframe}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Generated:</span>
                    <span className="ml-2">{formatDate(currentAnalysis.generatedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Analysis:</span>
                    <span className="ml-2">{formatDate(currentAnalysis.nextAnalysis)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAnalysis.insights.slice(0, 4).map((insight, index) => (
                    <div key={insight.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStrengthColor(insight.strength)}>
                            {insight.strength}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatConfidence(insight.confidence)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {currentAnalysis.insights.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No insights generated for this analysis. Try running the analysis with different parameters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {currentAnalysis.insights.map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getInsightIcon(insight.type)}
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getInsightColor(insight.type)}>
                            {insight.type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStrengthColor(insight.strength)}>
                            {insight.strength}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{insight.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Affected Communities</h4>
                          <p className="text-sm text-gray-600">
                            {insight.affectedCommunities.length} communities
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Confidence</h4>
                          <div className="flex items-center space-x-2">
                            <Progress value={insight.confidence * 100} className="flex-1 h-2" />
                            <span className="text-sm">{formatConfidence(insight.confidence)}</span>
                          </div>
                        </div>
                      </div>

                      {insight.implications.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Implications</h4>
                          <ul className="space-y-1">
                            {insight.implications.map((implication, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {implication}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.culturalConsiderations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Cultural Considerations</h4>
                          <ul className="space-y-1">
                            {insight.culturalConsiderations.map((consideration, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {consideration}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {currentAnalysis.patterns.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No patterns identified in this analysis. Patterns may emerge with more data or different timeframes.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {currentAnalysis.patterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{pattern.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {pattern.patternType.replace('_', ' ')}
                          </Badge>
                          <Badge className={pattern.frequency === 'recurring' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {pattern.frequency}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{pattern.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Strength</h4>
                          <div className="flex items-center space-x-2">
                            <Progress value={pattern.strength * 100} className="flex-1 h-2" />
                            <span className="text-sm">{Math.round(pattern.strength * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Predictability</h4>
                          <div className="flex items-center space-x-2">
                            <Progress value={pattern.predictability * 100} className="flex-1 h-2" />
                            <span className="text-sm">{Math.round(pattern.predictability * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Communities</h4>
                          <p className="text-sm text-gray-600">{pattern.communities.length} affected</p>
                        </div>
                      </div>

                      {pattern.factors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Contributing Factors</h4>
                          <div className="space-y-2">
                            {pattern.factors.map((factor, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{factor.factor}</span>
                                  <Badge variant="outline">
                                    {factor.influence > 0 ? '+' : ''}{Math.round(factor.influence * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{factor.description}</p>
                                {factor.evidence.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Evidence: {factor.evidence.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pattern.examples.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Examples</h4>
                          <div className="space-y-2">
                            {pattern.examples.slice(0, 3).map((example, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{example.communityName}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(example.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{example.example}</p>
                                <p className="text-xs text-green-600">{example.outcome}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {currentAnalysis.recommendations.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No specific recommendations generated. This may indicate that communities are performing well overall.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {currentAnalysis.recommendations.map((recommendation) => (
                  <Card key={recommendation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {recommendation.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Expected Impact</h4>
                          <p className="text-sm text-gray-600">{recommendation.expectedImpact}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Timeframe</h4>
                          <p className="text-sm text-gray-600">{recommendation.timeframe}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Target Communities</h4>
                          <p className="text-sm text-gray-600">
                            {recommendation.targetCommunities.length} communities
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Required Resources</h4>
                          <ul className="space-y-1">
                            {recommendation.resources.map((resource, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {resource}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Key Stakeholders</h4>
                          <ul className="space-y-1">
                            {recommendation.stakeholders.map((stakeholder, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {stakeholder}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {recommendation.culturalConsiderations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Cultural Considerations</h4>
                          <ul className="space-y-1">
                            {recommendation.culturalConsiderations.map((consideration, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {consideration}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recommendation.successMetrics.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Success Metrics</h4>
                          <ul className="space-y-1">
                            {recommendation.successMetrics.map((metric, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trend Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Community</th>
                        <th className="text-left p-2">Health Score</th>
                        <th className="text-left p-2">Engagement</th>
                        <th className="text-left p-2">Service Utilization</th>
                        <th className="text-left p-2">Cultural Context</th>
                        <th className="text-left p-2">Population</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnalysis.trendData.map((dataPoint, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{dataPoint.communityName}</td>
                          <td className="p-2">{dataPoint.metrics.healthScore?.toFixed(1) || 'N/A'}</td>
                          <td className="p-2">{dataPoint.metrics.communityEngagement?.toFixed(1) || 'N/A'}</td>
                          <td className="p-2">{dataPoint.metrics.serviceUtilization?.toFixed(1) || 'N/A'}</td>
                          <td className="p-2 capitalize">{dataPoint.culturalContext}</td>
                          <td className="p-2">{dataPoint.population?.toLocaleString() || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    currentAnalysis?.id === analysis.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium capitalize">
                        {analysis.analysisType.replace('_', ' ')} Analysis
                      </h4>
                      <p className="text-sm text-gray-600">
                        {analysis.communities.length} communities • {formatDate(analysis.generatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {analysis.timeframe}
                      </Badge>
                      <Badge className={getStrengthColor('moderate')}>
                        {formatConfidence(analysis.confidence)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Analysis State */}
      {!currentAnalysis && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
            <p className="text-gray-600 mb-4">
              Run your first cross-community trend analysis to identify patterns and insights.
            </p>
            <Button onClick={performNewAnalysis}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}