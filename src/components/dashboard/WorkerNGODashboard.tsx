'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Lightbulb,
  HandHeart,
  Share2,
  Award,
  Clock,
  DollarSign,
  UserCheck,
  Building,
  Zap
} from 'lucide-react';

interface ServiceGap {
  id: string;
  service: string;
  location: string;
  gapType: 'geographic' | 'demographic' | 'temporal' | 'capacity';
  severity: number; // 1-10
  impact: number; // 1-10
  affectedPopulation: number;
  recommendations: string[];
  evidence: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ProgramAnalysis {
  id: string;
  programName: string;
  organization: string;
  effectiveness: number; // 0-100
  reach: number;
  satisfaction: number; // 0-100
  outcomes: string[];
  challenges: string[];
  improvements: string[];
  budget: number;
  costPerBeneficiary: number;
  category: string;
}

interface Partnership {
  id: string;
  partnerName: string;
  partnerType: 'ngo' | 'government' | 'business' | 'community' | 'academic';
  opportunityType: 'resource_sharing' | 'joint_program' | 'knowledge_exchange' | 'funding';
  description: string;
  potentialImpact: number; // 1-10
  feasibility: number; // 1-10
  requirements: string[];
  benefits: string[];
  nextSteps: string[];
}

interface ImpactEvidence {
  id: string;
  programId: string;
  evidenceType: 'quantitative' | 'qualitative' | 'mixed';
  metric: string;
  value: string;
  timeframe: string;
  source: string;
  reliability: number; // 1-10
  stories: string[];
}

interface WorkerNGODashboardProps {
  organizationId: string;
  userRole: 'worker' | 'coordinator' | 'manager';
  region?: string;
}

export default function WorkerNGODashboard({ 
  organizationId, 
  userRole, 
  region 
}: WorkerNGODashboardProps) {
  const [serviceGaps, setServiceGaps] = useState<ServiceGap[]>([]);
  const [programAnalyses, setProgramAnalyses] = useState<ProgramAnalysis[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [impactEvidence, setImpactEvidence] = useState<ImpactEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalPrograms: 0,
    averageEffectiveness: 0,
    totalReach: 0,
    criticalGaps: 0,
    activePartnerships: 0,
    evidenceItems: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, region]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all dashboard data in parallel
      const [
        gapsRes,
        programsRes,
        partnershipsRes,
        evidenceRes,
        summaryRes
      ] = await Promise.all([
        fetch(`/api/worker/service-gaps?organizationId=${organizationId}${region ? `&region=${region}` : ''}`),
        fetch(`/api/worker/program-analysis?organizationId=${organizationId}${region ? `&region=${region}` : ''}`),
        fetch(`/api/worker/partnerships?organizationId=${organizationId}${region ? `&region=${region}` : ''}`),
        fetch(`/api/worker/impact-evidence?organizationId=${organizationId}${region ? `&region=${region}` : ''}`),
        fetch(`/api/worker/summary-metrics?organizationId=${organizationId}${region ? `&region=${region}` : ''}`)
      ]);

      if (gapsRes.ok) {
        const data = await gapsRes.json();
        setServiceGaps(data.gaps || []);
      }

      if (programsRes.ok) {
        const data = await programsRes.json();
        setProgramAnalyses(data.programs || []);
      }

      if (partnershipsRes.ok) {
        const data = await partnershipsRes.json();
        setPartnerships(data.partnerships || []);
      }

      if (evidenceRes.ok) {
        const data = await evidenceRes.json();
        setImpactEvidence(data.evidence || []);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGapTypeIcon = (type: string) => {
    switch (type) {
      case 'geographic': return <MapPin className="h-4 w-4" />;
      case 'demographic': return <Users className="h-4 w-4" />;
      case 'temporal': return <Clock className="h-4 w-4" />;
      case 'capacity': return <Building className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'ngo': return 'text-blue-600 bg-blue-100';
      case 'government': return 'text-purple-600 bg-purple-100';
      case 'business': return 'text-green-600 bg-green-100';
      case 'community': return 'text-orange-600 bg-orange-100';
      case 'academic': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[...Array(6)].map((_, i) => (
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
            Worker & NGO Portal
          </h1>
          <p className="text-gray-600">
            Service gap analysis, program effectiveness, and collaboration opportunities
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share Insights
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Programs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.totalPrograms}
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
                <p className="text-sm font-medium text-gray-600">Avg Effectiveness</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.averageEffectiveness}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">People Reached</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.totalReach.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Critical Gaps</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.criticalGaps}
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
                <p className="text-sm font-medium text-gray-600">Partnerships</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.activePartnerships}
                </p>
              </div>
              <HandHeart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Evidence Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryMetrics.evidenceItems}
                </p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gaps" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gaps">Service Gap Analysis</TabsTrigger>
          <TabsTrigger value="programs">Program Effectiveness</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Service Gap Analysis</h2>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Analysis
            </Button>
          </div>
          
          <div className="grid gap-4">
            {serviceGaps.slice(0, 8).map((gap) => (
              <Card key={gap.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {getGapTypeIcon(gap.gapType)}
                        <span>{gap.service}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(gap.priority)}>
                          {gap.priority} priority
                        </Badge>
                        <Badge variant="outline">{gap.gapType} gap</Badge>
                        <Badge variant="secondary">{gap.location}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        Severity: {gap.severity}/10
                      </div>
                      <div className="text-sm text-gray-600">
                        Impact: {gap.impact}/10
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Affected Population</h4>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{gap.affectedPopulation.toLocaleString()} people</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Recommendations</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {gap.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Gap Type: {gap.gapType.replace('_', ' ')}
                        </div>
                        <Button size="sm">
                          Address Gap
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Program Effectiveness Analysis</h2>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Compare Programs
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programAnalyses.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{program.programName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{program.organization}</p>
                      <Badge variant="outline" className="mt-2">{program.category}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {program.effectiveness}%
                      </div>
                      <div className="text-sm text-gray-600">Effectiveness</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {program.reach.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">People Reached</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
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
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium ml-1">${program.budget.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost/Person:</span>
                        <span className="font-medium ml-1">${program.costPerBeneficiary}</span>
                      </div>
                    </div>

                    {program.improvements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Improvement Suggestions</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {program.improvements.slice(0, 2).map((improvement, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{improvement}</span>
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

        <TabsContent value="collaboration" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Collaboration Opportunities</h2>
            <Button variant="outline" size="sm">
              <HandHeart className="h-4 w-4 mr-2" />
              Find Partners
            </Button>
          </div>
          
          <div className="grid gap-4">
            {partnerships.map((partnership) => (
              <Card key={partnership.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{partnership.partnerName}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPartnerTypeColor(partnership.partnerType)}>
                          {partnership.partnerType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{partnership.opportunityType.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        Impact: {partnership.potentialImpact}/10
                      </div>
                      <div className="text-sm text-gray-600">
                        Feasibility: {partnership.feasibility}/10
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">{partnership.description}</p>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Potential Benefits</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {partnership.benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {partnership.requirements.slice(0, 2).map((req, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <UserCheck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Next Steps: {partnership.nextSteps[0] || 'Contact partner'}
                        </div>
                        <Button size="sm">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Evidence Builder</h2>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {impactEvidence.map((evidence) => (
              <Card key={evidence.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{evidence.metric}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{evidence.evidenceType}</Badge>
                        <Badge variant="secondary">Reliability: {evidence.reliability}/10</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {evidence.value}
                      </div>
                      <div className="text-sm text-gray-600">{evidence.timeframe}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Source</h4>
                      <p className="text-sm text-gray-600">{evidence.source}</p>
                    </div>

                    {evidence.stories.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Supporting Stories</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {evidence.stories.slice(0, 2).map((story, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{story}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Evidence Type: {evidence.evidenceType}
                        </div>
                        <Button size="sm" variant="outline">
                          Use in Report
                        </Button>
                      </div>
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