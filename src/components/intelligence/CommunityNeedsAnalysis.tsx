'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Users, Clock, Target, TrendingUp, 
  Filter, RefreshCw, ChevronDown, ChevronRight,
  Home, GraduationCap, Heart, Briefcase, Palette,
  Scale, Leaf, Car, Building, Phone
} from 'lucide-react';

interface CommunityNeed {
  need: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subcategory?: string;
  community: string;
  evidence: string[];
  confidence: number;
  affectedGroups: string[];
  timeframe: string;
  estimatedImpact: number;
  relatedNeeds: string[];
  potentialSolutions: string[];
  resourcesRequired: string[];
  stakeholders: string[];
  culturalConsiderations: string[];
  geographicScope: string;
  trends: {
    increasing: boolean;
    stable: boolean;
    decreasing: boolean;
    emerging: boolean;
  };
}

interface NeedsAnalysisResult {
  needs: CommunityNeed[];
  needsHierarchy: {
    critical: CommunityNeed[];
    high: CommunityNeed[];
    medium: CommunityNeed[];
    low: CommunityNeed[];
  };
  crossCuttingThemes: Array<{
    theme: string;
    relatedNeeds: string[];
    priority: number;
  }>;
  systemicIssues: Array<{
    issue: string;
    rootCauses: string[];
    affectedNeeds: string[];
    systemicSolutions: string[];
  }>;
  emergingNeeds: CommunityNeed[];
  summary: {
    totalNeeds: number;
    criticalNeeds: number;
    mostAffectedCommunities: string[];
    topCategories: Array<{ category: string; count: number }>;
    urgentActionRequired: boolean;
  };
}

interface CommunityNeedsAnalysisProps {
  communityId?: string;
  className?: string;
}

const CATEGORY_ICONS = {
  housing: <Home className="w-4 h-4" />,
  youth_development: <Users className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
  employment: <Briefcase className="w-4 h-4" />,
  culture: <Palette className="w-4 h-4" />,
  justice: <Scale className="w-4 h-4" />,
  environment: <Leaf className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
  social_services: <Building className="w-4 h-4" />
};

export default function CommunityNeedsAnalysis({ 
  communityId, 
  className = '' 
}: CommunityNeedsAnalysisProps) {
  const [analysis, setAnalysis] = useState<NeedsAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [expandedNeeds, setExpandedNeeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNeedsAnalysis();
  }, [communityId, selectedCategory, selectedUrgency]);

  const loadNeedsAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (communityId) params.append('communityId', communityId);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedUrgency !== 'all') params.append('urgency', selectedUrgency);

      const response = await fetch(`/api/intelligence/needs-analysis?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load needs analysis');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[urgency as keyof typeof colors] || colors.medium;
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'critical') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (urgency === 'high') return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || <Building className="w-4 h-4" />;
  };

  const toggleNeedExpansion = (needId: string) => {
    const newExpanded = new Set(expandedNeeds);
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId);
    } else {
      newExpanded.add(needId);
    }
    setExpandedNeeds(newExpanded);
  };

  const getTrendIndicator = (trends: CommunityNeed['trends']) => {
    if (trends.emerging) return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Emerging</Badge>;
    if (trends.increasing) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trends.decreasing) return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Error loading needs analysis: {error}</span>
          </div>
          <Button 
            onClick={loadNeedsAnalysis}
            className="mt-4"
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>No needs analysis available</p>
            <p className="text-sm mt-1">Upload documents to generate community needs analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Community Needs Analysis</h2>
          <p className="text-gray-600">
            Comprehensive analysis of community needs and priorities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadNeedsAnalysis}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Needs</p>
                <p className="text-2xl font-bold">{analysis.summary.totalNeeds}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Needs</p>
                <p className="text-2xl font-bold text-red-600">{analysis.summary.criticalNeeds}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emerging Needs</p>
                <p className="text-2xl font-bold text-purple-600">{analysis.emergingNeeds.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Communities</p>
                <p className="text-2xl font-bold text-green-600">
                  {analysis.summary.mostAffectedCommunities.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="all">All Categories</option>
                {analysis.summary.topCategories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category.replace('_', ' ')} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Urgency</label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="all">All Urgency Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="needs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="needs">Identified Needs</TabsTrigger>
          <TabsTrigger value="hierarchy">Needs Hierarchy</TabsTrigger>
          <TabsTrigger value="themes">Cross-cutting Themes</TabsTrigger>
          <TabsTrigger value="systemic">Systemic Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="needs" className="space-y-4">
          {analysis.needs.length > 0 ? (
            <div className="space-y-4">
              {analysis.needs.map((need, index) => {
                const needId = `need-${index}`;
                const isExpanded = expandedNeeds.has(needId);
                
                return (
                  <Card key={needId} className="border-l-4" style={{
                    borderLeftColor: need.urgency === 'critical' ? '#DC2626' :
                                   need.urgency === 'high' ? '#EA580C' :
                                   need.urgency === 'medium' ? '#D97706' : '#059669'
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryIcon(need.category)}
                            <CardTitle className="text-lg">{need.need}</CardTitle>
                            <Badge className={getUrgencyColor(need.urgency)}>
                              {need.urgency}
                            </Badge>
                            {getTrendIndicator(need.trends)}
                          </div>
                          <CardDescription>
                            {need.community} • {need.category.replace('_', ' ')} • Impact: {need.estimatedImpact}/10
                          </CardDescription>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNeedExpansion(needId)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        {/* Evidence */}
                        {need.evidence.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Evidence</h4>
                            <ul className="text-sm space-y-1">
                              {need.evidence.map((evidence, i) => (
                                <li key={i} className="text-gray-600 italic">
                                  "{evidence}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Affected Groups */}
                        {need.affectedGroups.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Affected Groups</h4>
                            <div className="flex flex-wrap gap-1">
                              {need.affectedGroups.map((group, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Potential Solutions */}
                        {need.potentialSolutions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Potential Solutions</h4>
                            <ul className="text-sm space-y-1">
                              {need.potentialSolutions.map((solution, i) => (
                                <li key={i} className="text-gray-600">• {solution}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Stakeholders */}
                        {need.stakeholders.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Key Stakeholders</h4>
                            <div className="flex flex-wrap gap-1">
                              {need.stakeholders.map((stakeholder, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {stakeholder}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cultural Considerations */}
                        {need.culturalConsiderations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Cultural Considerations</h4>
                            <ul className="text-sm space-y-1">
                              {need.culturalConsiderations.map((consideration, i) => (
                                <li key={i} className="text-gray-600">• {consideration}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t text-sm">
                          <div>
                            <span className="font-medium">Timeframe:</span>
                            <div className="text-gray-600">{need.timeframe.replace('_', ' ')}</div>
                          </div>
                          <div>
                            <span className="font-medium">Scope:</span>
                            <div className="text-gray-600">{need.geographicScope.replace('_', ' ')}</div>
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span>
                            <div className="text-gray-600">{Math.round(need.confidence * 100)}%</div>
                          </div>
                          <div>
                            <span className="font-medium">Impact:</span>
                            <div className="text-gray-600">{need.estimatedImpact}/10</div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p>No needs found matching current filters</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(analysis.needsHierarchy).map(([level, needs]) => (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getUrgencyIcon(level)}
                    {level.charAt(0).toUpperCase() + level.slice(1)} Priority
                    <Badge variant="secondary">{needs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {needs.length > 0 ? (
                    <div className="space-y-2">
                      {needs.map((need, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-sm">{need.need}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {need.community} • {need.category.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No {level} priority needs identified</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          {analysis.crossCuttingThemes.length > 0 ? (
            <div className="space-y-4">
              {analysis.crossCuttingThemes.map((theme, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{theme.theme}</span>
                      <Badge variant="secondary">Priority: {theme.priority}/10</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Related Needs</h4>
                      <div className="flex flex-wrap gap-1">
                        {theme.relatedNeeds.map((need, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p>No cross-cutting themes identified</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="systemic" className="space-y-4">
          {analysis.systemicIssues.length > 0 ? (
            <div className="space-y-4">
              {analysis.systemicIssues.map((issue, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{issue.issue}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Root Causes</h4>
                      <ul className="text-sm space-y-1">
                        {issue.rootCauses.map((cause, i) => (
                          <li key={i} className="text-gray-600">• {cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Affected Needs</h4>
                      <div className="flex flex-wrap gap-1">
                        {issue.affectedNeeds.map((need, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Systemic Solutions</h4>
                      <ul className="text-sm space-y-1">
                        {issue.systemicSolutions.map((solution, i) => (
                          <li key={i} className="text-gray-600">• {solution}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p>No systemic issues identified</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}