'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, MapPin, Users, Clock, Target, TrendingUp, 
  Filter, RefreshCw, ChevronDown, ChevronRight, Lightbulb,
  GraduationCap, Heart, Briefcase, Home, Car, Palette,
  Scale, Building, Phone, Shield
} from 'lucide-react';

interface ServiceGap {
  service: string;
  serviceType: string;
  location: string;
  impact: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  gapType: 'missing' | 'inadequate' | 'inaccessible' | 'culturally_inappropriate' | 'under_resourced';
  evidence: string[];
  affectedPopulation: {
    groups: string[];
    estimatedSize: number;
    demographics: string[];
  };
  currentAlternatives: string[];
  barriers: Array<{
    type: string;
    description: string;
    severity: number;
  }>;
  recommendations: Array<{
    solution: string;
    priority: number;
    timeframe: string;
    resourcesRequired: string[];
    stakeholders: string[];
    estimatedCost: string;
    feasibility: number;
  }>;
  relatedNeeds: string[];
  culturalConsiderations: string[];
  successExamples: string[];
  confidence: number;
  geographicScope: string;
  trends: {
    worsening: boolean;
    stable: boolean;
    improving: boolean;
    emerging: boolean;
  };
}

interface ServiceGapAnalysisResult {
  gaps: ServiceGap[];
  gapsByType: Record<string, ServiceGap[]>;
  gapsByUrgency: Record<string, ServiceGap[]>;
  gapsByLocation: Record<string, ServiceGap[]>;
  systemicGaps: Array<{
    systemicIssue: string;
    affectedServices: string[];
    rootCause: string;
    systemicSolution: string;
    impactedCommunities: string[];
  }>;
  priorityRecommendations: Array<{
    recommendation: string;
    addressedGaps: string[];
    totalImpact: number;
    feasibilityScore: number;
    urgencyScore: number;
    overallPriority: number;
  }>;
  summary: {
    totalGaps: number;
    criticalGaps: number;
    mostAffectedLocations: string[];
    topServiceTypes: Array<{ type: string; count: number }>;
    averageImpact: number;
    urgentActionRequired: boolean;
  };
}

interface ServiceGapAnalysisProps {
  communityId?: string;
  className?: string;
}

const SERVICE_TYPE_ICONS = {
  education: <GraduationCap className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
  employment: <Briefcase className="w-4 h-4" />,
  housing: <Home className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
  cultural: <Palette className="w-4 h-4" />,
  recreation: <Users className="w-4 h-4" />,
  support: <Building className="w-4 h-4" />,
  justice: <Scale className="w-4 h-4" />,
  emergency: <Shield className="w-4 h-4" />
};

export default function ServiceGapAnalysis({ 
  communityId, 
  className = '' 
}: ServiceGapAnalysisProps) {
  const [analysis, setAnalysis] = useState<ServiceGapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedGapType, setSelectedGapType] = useState<string>('all');
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadServiceGapAnalysis();
  }, [communityId, selectedServiceType, selectedUrgency, selectedGapType]);

  const loadServiceGapAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (communityId) params.append('communityId', communityId);
      if (selectedServiceType !== 'all') params.append('serviceType', selectedServiceType);
      if (selectedUrgency !== 'all') params.append('urgency', selectedUrgency);
      if (selectedGapType !== 'all') params.append('gapType', selectedGapType);

      const response = await fetch(`/api/intelligence/service-gaps?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load service gap analysis');
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
  };  const g
etUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[urgency as keyof typeof colors] || colors.medium;
  };

  const getGapTypeColor = (gapType: string) => {
    const colors = {
      missing: 'bg-red-100 text-red-800',
      inadequate: 'bg-orange-100 text-orange-800',
      inaccessible: 'bg-yellow-100 text-yellow-800',
      culturally_inappropriate: 'bg-purple-100 text-purple-800',
      under_resourced: 'bg-blue-100 text-blue-800'
    };
    return colors[gapType as keyof typeof colors] || colors.missing;
  };

  const getServiceTypeIcon = (serviceType: string) => {
    return SERVICE_TYPE_ICONS[serviceType as keyof typeof SERVICE_TYPE_ICONS] || <Building className="w-4 h-4" />;
  };

  const toggleGapExpansion = (gapId: string) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(gapId)) {
      newExpanded.delete(gapId);
    } else {
      newExpanded.add(gapId);
    }
    setExpandedGaps(newExpanded);
  };

  const getTrendIndicator = (trends: ServiceGap['trends']) => {
    if (trends.emerging) return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Emerging</Badge>;
    if (trends.worsening) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trends.improving) return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  const getCostColor = (cost: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      very_high: 'text-red-600'
    };
    return colors[cost as keyof typeof colors] || colors.medium;
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
            <span>Error loading service gap analysis: {error}</span>
          </div>
          <Button 
            onClick={loadServiceGapAnalysis}
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
            <p>No service gap analysis available</p>
            <p className="text-sm mt-1">Upload documents to generate service gap analysis</p>
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
          <h2 className="text-2xl font-bold">Service Gap Analysis</h2>
          <p className="text-gray-600">
            Identification of missing, inadequate, and inaccessible services
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadServiceGapAnalysis}
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
                <p className="text-sm font-medium text-gray-600">Total Gaps</p>
                <p className="text-2xl font-bold">{analysis.summary.totalGaps}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Gaps</p>
                <p className="text-2xl font-bold text-red-600">{analysis.summary.criticalGaps}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Impact</p>
                <p className="text-2xl font-bold text-orange-600">{analysis.summary.averageImpact}/10</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Locations</p>
                <p className="text-2xl font-bold text-green-600">
                  {analysis.summary.mostAffectedLocations.length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="all">All Service Types</option>
                {analysis.summary.topServiceTypes.map(type => (
                  <option key={type.type} value={type.type}>
                    {type.type} ({type.count})
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

            <div>
              <label className="text-sm font-medium">Gap Type</label>
              <select
                value={selectedGapType}
                onChange={(e) => setSelectedGapType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="all">All Gap Types</option>
                <option value="missing">Missing</option>
                <option value="inadequate">Inadequate</option>
                <option value="inaccessible">Inaccessible</option>
                <option value="culturally_inappropriate">Culturally Inappropriate</option>
                <option value="under_resourced">Under Resourced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="gaps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gaps">Service Gaps</TabsTrigger>
          <TabsTrigger value="recommendations">Priority Recommendations</TabsTrigger>
          <TabsTrigger value="systemic">Systemic Issues</TabsTrigger>
          <TabsTrigger value="overview">Gap Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          {analysis.gaps.length > 0 ? (
            <div className="space-y-4">
              {analysis.gaps.map((gap, index) => {
                const gapId = `gap-${index}`;
                const isExpanded = expandedGaps.has(gapId);
                
                return (
                  <Card key={gapId} className="border-l-4" style={{
                    borderLeftColor: gap.urgency === 'critical' ? '#DC2626' :
                                   gap.urgency === 'high' ? '#EA580C' :
                                   gap.urgency === 'medium' ? '#D97706' : '#059669'
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getServiceTypeIcon(gap.serviceType)}
                            <CardTitle className="text-lg">{gap.service}</CardTitle>
                            <Badge className={getUrgencyColor(gap.urgency)}>
                              {gap.urgency}
                            </Badge>
                            <Badge className={getGapTypeColor(gap.gapType)}>
                              {gap.gapType.replace('_', ' ')}
                            </Badge>
                            {getTrendIndicator(gap.trends)}
                          </div>
                          <CardDescription>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {gap.location} • {gap.serviceType} • Impact: {gap.impact}/10
                          </CardDescription>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGapExpansion(gapId)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        {/* Evidence */}
                        {gap.evidence.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Evidence</h4>
                            <ul className="text-sm space-y-1">
                              {gap.evidence.map((evidence, i) => (
                                <li key={i} className="text-gray-600 italic">
                                  "{evidence}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Affected Population */}
                        <div>
                          <h4 className="font-medium text-sm mb-2">Affected Population</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Groups:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {gap.affectedPopulation.groups.map((group, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {group}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Est. Size:</span>
                              <div className="text-gray-600">{gap.affectedPopulation.estimatedSize} people</div>
                            </div>
                            <div>
                              <span className="font-medium">Scope:</span>
                              <div className="text-gray-600">{gap.geographicScope.replace('_', ' ')}</div>
                            </div>
                          </div>
                        </div>

                        {/* Barriers */}
                        {gap.barriers.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Barriers</h4>
                            <div className="space-y-2">
                              {gap.barriers.map((barrier, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium text-sm capitalize">{barrier.type.replace('_', ' ')}</span>
                                    <div className="text-xs text-gray-600">{barrier.description}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Severity: {barrier.severity}/10
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {gap.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                            <div className="space-y-3">
                              {gap.recommendations.map((rec, i) => (
                                <div key={i} className="p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-sm">{rec.solution}</h5>
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        Priority: {rec.priority}/10
                                      </Badge>
                                      <Badge variant="outline" className={`text-xs ${getCostColor(rec.estimatedCost)}`}>
                                        {rec.estimatedCost.replace('_', ' ')} cost
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="font-medium">Timeframe:</span>
                                      <div className="text-gray-600">{rec.timeframe.replace('_', ' ')}</div>
                                    </div>
                                    <div>
                                      <span className="font-medium">Feasibility:</span>
                                      <div className="text-gray-600">{rec.feasibility}/10</div>
                                    </div>
                                  </div>

                                  {rec.stakeholders.length > 0 && (
                                    <div className="mt-2">
                                      <span className="font-medium text-xs">Stakeholders:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {rec.stakeholders.map((stakeholder, j) => (
                                          <Badge key={j} variant="outline" className="text-xs">
                                            {stakeholder}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cultural Considerations */}
                        {gap.culturalConsiderations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Cultural Considerations</h4>
                            <ul className="text-sm space-y-1">
                              {gap.culturalConsiderations.map((consideration, i) => (
                                <li key={i} className="text-gray-600">• {consideration}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Success Examples */}
                        {gap.successExamples.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Success Examples</h4>
                            <ul className="text-sm space-y-1">
                              {gap.successExamples.map((example, i) => (
                                <li key={i} className="text-gray-600">• {example}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t text-sm">
                          <div>
                            <span className="font-medium">Confidence:</span>
                            <div className="text-gray-600">{Math.round(gap.confidence * 100)}%</div>
                          </div>
                          <div>
                            <span className="font-medium">Impact:</span>
                            <div className="text-gray-600">{gap.impact}/10</div>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>
                            <div className="text-gray-600">{gap.gapType.replace('_', ' ')}</div>
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
                  <p>No service gaps found matching current filters</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {analysis.priorityRecommendations.length > 0 ? (
            <div className="space-y-4">
              {analysis.priorityRecommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <span>{rec.recommendation}</span>
                      </div>
                      <Badge variant="secondary">
                        Priority: {rec.overallPriority}/10
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Addresses Service Gaps</h4>
                      <div className="flex flex-wrap gap-1">
                        {rec.addressedGaps.map((gap, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Impact:</span>
                        <div className="text-gray-600">{rec.totalImpact}</div>
                      </div>
                      <div>
                        <span className="font-medium">Feasibility:</span>
                        <div className="text-gray-600">{rec.feasibilityScore}/10</div>
                      </div>
                      <div>
                        <span className="font-medium">Urgency:</span>
                        <div className="text-gray-600">{rec.urgencyScore}/10</div>
                      </div>
                      <div>
                        <span className="font-medium">Overall Priority:</span>
                        <div className="text-gray-600 font-medium">{rec.overallPriority}/10</div>
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
                  <p>No priority recommendations available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="systemic" className="space-y-4">
          {analysis.systemicGaps.length > 0 ? (
            <div className="space-y-4">
              {analysis.systemicGaps.map((issue, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{issue.systemicIssue}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Root Cause</h4>
                      <p className="text-sm text-gray-600">{issue.rootCause}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Affected Services</h4>
                      <div className="flex flex-wrap gap-1">
                        {issue.affectedServices.map((service, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Impacted Communities</h4>
                      <div className="flex flex-wrap gap-1">
                        {issue.impactedCommunities.map((community, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {community}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Systemic Solution</h4>
                      <p className="text-sm text-gray-600">{issue.systemicSolution}</p>
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

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gaps by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Gaps by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.gapsByType).map(([type, gaps]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="secondary">{gaps.length}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gaps by Urgency */}
            <Card>
              <CardHeader>
                <CardTitle>Gaps by Urgency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.gapsByUrgency).map(([urgency, gaps]) => (
                    <div key={urgency} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{urgency}</span>
                      <Badge className={getUrgencyColor(urgency)}>{gaps.length}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Affected Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Most Affected Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.summary.mostAffectedLocations.map((location, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{location}</span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.gapsByLocation[location]?.length || 0} gaps
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Service Types */}
            <Card>
              <CardHeader>
                <CardTitle>Top Service Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.summary.topServiceTypes.map((serviceType, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getServiceTypeIcon(serviceType.type)}
                        <span className="text-sm capitalize">{serviceType.type}</span>
                      </div>
                      <Badge variant="secondary">{serviceType.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}