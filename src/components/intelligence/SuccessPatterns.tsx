'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Star,
  Clock,
  MapPin
} from 'lucide-react';

interface SuccessPattern {
  pattern: string;
  communities: string[];
  replicability: number;
  requirements: string[];
  evidence: string[];
  outcomes: string[];
  category: string;
  successFactors: string[];
  challenges: string[];
  timeline: string;
  resources: string[];
  stakeholders: string[];
  scalability: string;
  culturalSafety: string;
  sustainability: number;
}

interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  pattern: SuccessPattern;
  implementationGuide: {
    steps: string[];
    timeline: string;
    resources: string[];
    risks: string[];
    mitigations: string[];
  };
  adaptationGuidance: string[];
  measurableOutcomes: string[];
}

interface CrossCommunityAnalysis {
  sharedPatterns: SuccessPattern[];
  uniqueApproaches: Array<{
    community: string;
    approach: string;
    effectiveness: number;
    transferability: number;
  }>;
  emergingTrends: Array<{
    trend: string;
    communities: string[];
    strength: number;
    trajectory: string;
  }>;
  replicationOpportunities: Array<{
    sourcePattern: string;
    sourceCommunity: string;
    targetCommunities: string[];
    adaptationNeeds: string[];
    expectedOutcomes: string[];
  }>;
}

interface SuccessPatternsProps {
  documentContent?: string;
  communityContext?: string;
  documentTitle?: string;
  communityPatterns?: Array<{
    communityId: string;
    communityName: string;
    patterns: SuccessPattern[];
  }>;
}

export default function SuccessPatterns({ 
  documentContent, 
  communityContext, 
  documentTitle,
  communityPatterns 
}: SuccessPatternsProps) {
  const [patterns, setPatterns] = useState<SuccessPattern[]>([]);
  const [templates, setTemplates] = useState<PatternTemplate[]>([]);
  const [crossCommunityAnalysis, setCrossCommunityAnalysis] = useState<CrossCommunityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('patterns');

  const identifyPatterns = async () => {
    if (!documentContent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence/success-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'identify',
          documentContent,
          communityContext,
          documentTitle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to identify success patterns');
      }

      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTemplates = async () => {
    if (patterns.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence/success-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTemplates',
          successPatterns: patterns
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create pattern templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      setActiveTab('templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCrossCommunity = async () => {
    if (!communityPatterns || communityPatterns.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence/success-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyzeCrossCommunity',
          communityPatterns
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze cross-community patterns');
      }

      const data = await response.json();
      setCrossCommunityAnalysis(data.analysis);
      setActiveTab('cross-community');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentContent) {
      identifyPatterns();
    }
  }, [documentContent, communityContext, documentTitle]);

  const getCategoryColor = (category: string) => {
    const colors = {
      youth_development: 'bg-blue-100 text-blue-800',
      cultural_strengthening: 'bg-purple-100 text-purple-800',
      service_delivery: 'bg-green-100 text-green-800',
      economic_development: 'bg-yellow-100 text-yellow-800',
      community_engagement: 'bg-pink-100 text-pink-800',
      education: 'bg-indigo-100 text-indigo-800',
      health_wellbeing: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getScalabilityIcon = (scalability: string) => {
    switch (scalability) {
      case 'local': return <MapPin className="h-4 w-4" />;
      case 'regional': return <Users className="h-4 w-4" />;
      case 'territory_wide': return <TrendingUp className="h-4 w-4" />;
      case 'national': return <Star className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Success Patterns</h2>
          <p className="text-gray-600">
            Identify and analyze successful approaches that can be replicated across communities
          </p>
        </div>
        <div className="flex space-x-2">
          {patterns.length > 0 && (
            <Button onClick={createTemplates} disabled={loading}>
              Create Templates
            </Button>
          )}
          {communityPatterns && communityPatterns.length > 0 && (
            <Button onClick={analyzeCrossCommunity} disabled={loading}>
              Cross-Community Analysis
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patterns">Identified Patterns</TabsTrigger>
          <TabsTrigger value="templates" disabled={templates.length === 0}>
            Implementation Templates
          </TabsTrigger>
          <TabsTrigger value="cross-community" disabled={!crossCommunityAnalysis}>
            Cross-Community Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Identifying success patterns...</span>
                </div>
              </CardContent>
            </Card>
          ) : patterns.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">
                  {documentContent 
                    ? "No success patterns identified in this document." 
                    : "Provide document content to identify success patterns."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {patterns.map((pattern, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pattern.pattern}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getCategoryColor(pattern.category)}>
                            {pattern.category.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {getScalabilityIcon(pattern.scalability)}
                            <span className="text-sm text-gray-600 capitalize">
                              {pattern.scalability.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Replicability: {Math.round(pattern.replicability * 100)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Sustainability: {Math.round(pattern.sustainability * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Communities</h4>
                        <div className="flex flex-wrap gap-1">
                          {pattern.communities.map((community, i) => (
                            <Badge key={i} variant="outline">{community}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{pattern.timeline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Success Factors</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.successFactors.map((factor, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Outcomes</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.outcomes.map((outcome, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Requirements for Replication</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.requirements.map((requirement, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{requirement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">
                  Create implementation templates from identified success patterns.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{template.name}</span>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </CardTitle>
                    <p className="text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Implementation Steps</h4>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {template.implementationGuide.steps.map((step, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                          <p className="text-sm text-gray-600">{template.implementationGuide.timeline}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Resources</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {template.implementationGuide.resources.slice(0, 3).map((resource, i) => (
                              <li key={i}>• {resource}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Adaptation Guidance</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {template.adaptationGuidance.map((guidance, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <ExternalLink className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              <span>{guidance}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cross-community" className="space-y-4">
          {!crossCommunityAnalysis ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">
                  Analyze patterns across multiple communities to identify trends and replication opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Success Patterns</CardTitle>
                  <p className="text-gray-600">
                    Patterns that have worked across multiple communities
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {crossCommunityAnalysis.sharedPatterns.map((pattern, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{pattern.communities.length} communities</span>
                          <span>Replicability: {Math.round(pattern.replicability * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Replication Opportunities</CardTitle>
                  <p className="text-gray-600">
                    Successful patterns that could be adapted for other communities
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {crossCommunityAnalysis.replicationOpportunities.map((opportunity, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium">{opportunity.sourcePattern}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {opportunity.sourceCommunity}
                        </p>
                        <div className="mt-3">
                          <h5 className="text-sm font-medium">Target Communities:</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {opportunity.targetCommunities.map((community, i) => (
                              <Badge key={i} variant="outline">{community}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          <h5 className="text-sm font-medium">Expected Outcomes:</h5>
                          <ul className="text-sm text-gray-600 mt-1 space-y-1">
                            {opportunity.expectedOutcomes.map((outcome, i) => (
                              <li key={i}>• {outcome}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}