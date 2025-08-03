'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  FileText,
  MessageSquare,
  TrendingUp,
  Star,
  Calendar,
  UserCheck
} from 'lucide-react';

interface CulturalIntelligenceSummary {
  community_id: string;
  community_name: string;
  total_insights: number;
  insights_with_cultural_context: number;
  cultural_authority_validations: number;
  approved_validations: number;
  rejected_validations: number;
  pending_validations: number;
  protocol_compliance_checks: number;
  compliant_protocols: number;
  non_compliant_protocols: number;
  avg_cultural_impact_score: number;
  high_risk_assessments: number;
}

interface CulturalValidation {
  id: string;
  insight_id: string;
  community_id: string;
  cultural_authority_id: string;
  authority_role: string;
  validation_type: string;
  validation_status: string;
  validation_decision: string;
  cultural_guidance?: string;
  consultation_method?: string;
  consultation_date?: string;
  cultural_risk_assessment?: string;
  community_benefit_assessment?: string;
  created_at: string;
}

interface CulturalWorkflow {
  id: string;
  insight_id: string;
  community_id: string;
  workflow_type: string;
  workflow_status: string;
  current_step?: string;
  completed_steps: string[];
  remaining_steps: string[];
  estimated_completion_date?: string;
  priority_level: string;
  assigned_cultural_authorities: string[];
  created_at: string;
}

interface CulturalComplianceMetrics {
  community_id: string;
  community_name: string;
  aggregation_date: string;
  overall_compliance_rate?: number;
  data_sovereignty_compliance_rate?: number;
  traditional_knowledge_compliance_rate?: number;
  ceremonial_compliance_rate?: number;
  consultation_compliance_rate?: number;
  total_authority_validations: number;
  approved_validations: number;
  pending_validations: number;
  average_review_duration_days?: number;
  cultural_authority_satisfaction_score?: number;
  compliance_status: string;
}

export default function CulturalIntelligenceDashboard() {
  const [summary, setSummary] = useState<CulturalIntelligenceSummary[]>([]);
  const [validations, setValidations] = useState<CulturalValidation[]>([]);
  const [workflows, setWorkflows] = useState<CulturalWorkflow[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<CulturalComplianceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [selectedCommunity]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, validationsResponse, workflowsResponse, complianceResponse] = await Promise.all([
        fetch(`/api/cultural/intelligence/summary?type=overview${selectedCommunity ? `&communityId=${selectedCommunity}` : ''}`),
        fetch(`/api/cultural/intelligence/validations?${selectedCommunity ? `communityId=${selectedCommunity}&` : ''}limit=20`),
        fetch(`/api/cultural/intelligence/workflows?${selectedCommunity ? `communityId=${selectedCommunity}&` : ''}limit=20`),
        fetch(`/api/cultural/intelligence/summary?type=compliance${selectedCommunity ? `&communityId=${selectedCommunity}` : ''}`)
      ]);

      if (!summaryResponse.ok || !validationsResponse.ok || !workflowsResponse.ok || !complianceResponse.ok) {
        throw new Error('Failed to fetch cultural intelligence data');
      }

      const [summaryData, validationsData, workflowsData, complianceData] = await Promise.all([
        summaryResponse.json(),
        validationsResponse.json(),
        workflowsResponse.json(),
        complianceResponse.json()
      ]);

      setSummary(summaryData.data || []);
      setValidations(validationsData.data || []);
      setWorkflows(workflowsData.data || []);
      setComplianceMetrics(complianceData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'approved_with_conditions': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'requires_modification': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getWorkflowStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'awaiting_authority': return 'bg-yellow-500';
      case 'escalated': return 'bg-red-500';
      case 'suspended': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatValidationType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatWorkflowType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateOverallComplianceHealth = () => {
    if (complianceMetrics.length === 0) return 0;
    
    const avgCompliance = complianceMetrics.reduce((sum, metric) => 
      sum + (metric.overall_compliance_rate || 0), 0
    ) / complianceMetrics.length;
    
    return Math.round(avgCompliance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading cultural intelligence dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cultural Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Cultural safety compliance and authority validation for community intelligence
          </p>
        </div>
        <Button onClick={loadDashboardData} className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultural Contexts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.reduce((sum, s) => sum + s.insights_with_cultural_context, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Insights with cultural context
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authority Validations</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.reduce((sum, s) => sum + s.cultural_authority_validations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total validations conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.length > 0 ? Math.round(
                (summary.reduce((sum, s) => sum + s.approved_validations, 0) / 
                 Math.max(summary.reduce((sum, s) => sum + s.cultural_authority_validations, 0), 1)) * 100
              ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cultural authority approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Health</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calculateOverallComplianceHealth()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall cultural compliance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="validations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="validations">Authority Validations</TabsTrigger>
          <TabsTrigger value="workflows">Review Workflows</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Metrics</TabsTrigger>
          <TabsTrigger value="summary">Community Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="validations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Cultural Authority Validations
              </CardTitle>
              <CardDescription>
                Recent validations by cultural authorities and elders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validations.map((validation) => (
                  <div key={validation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {formatValidationType(validation.validation_type)}
                          </Badge>
                          <Badge variant="outline">
                            {validation.authority_role}
                          </Badge>
                        </div>
                        <p className="text-gray-700 font-medium">{validation.validation_decision}</p>
                        {validation.cultural_guidance && (
                          <p className="text-gray-600 mt-1 text-sm">{validation.cultural_guidance}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={`${getValidationStatusColor(validation.validation_status)} text-white`}>
                          {validation.validation_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {validation.cultural_risk_assessment && (
                          <Badge variant="outline" className="text-xs">
                            Risk: {validation.cultural_risk_assessment}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {validation.consultation_method && (
                          <span>Method: {validation.consultation_method}</span>
                        )}
                        {validation.consultation_date && (
                          <span>Date: {new Date(validation.consultation_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(validation.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {validations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cultural validations available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Cultural Review Workflows
              </CardTitle>
              <CardDescription>
                Active cultural review processes and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {formatWorkflowType(workflow.workflow_type)}
                          </Badge>
                          <Badge className={`${getPriorityColor(workflow.priority_level)} text-white text-xs`}>
                            {workflow.priority_level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Current Step: {workflow.current_step || 'Not specified'}</p>
                          <p>Authorities Assigned: {workflow.assigned_cultural_authorities.length}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={`${getWorkflowStatusColor(workflow.workflow_status)} text-white`}>
                          {workflow.workflow_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress:</span>
                        <span className="text-gray-700">
                          {workflow.completed_steps.length} / {workflow.completed_steps.length + workflow.remaining_steps.length} steps
                        </span>
                      </div>
                      <Progress 
                        value={(workflow.completed_steps.length / (workflow.completed_steps.length + workflow.remaining_steps.length)) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {workflow.estimated_completion_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Est. completion: {new Date(workflow.estimated_completion_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(workflow.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {workflows.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active cultural review workflows.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cultural Compliance Metrics
              </CardTitle>
              <CardDescription>
                Community-specific cultural protocol compliance rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceMetrics.map((metric) => (
                  <div key={`${metric.community_id}-${metric.aggregation_date}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{metric.community_name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getComplianceStatusColor(metric.compliance_status)}>
                          {metric.compliance_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(metric.aggregation_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(metric.overall_compliance_rate || 0)}%
                        </div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(metric.data_sovereignty_compliance_rate || 0)}%
                        </div>
                        <div className="text-xs text-gray-500">Data Sovereignty</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(metric.traditional_knowledge_compliance_rate || 0)}%
                        </div>
                        <div className="text-xs text-gray-500">Traditional Knowledge</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(metric.consultation_compliance_rate || 0)}%
                        </div>
                        <div className="text-xs text-gray-500">Consultation</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Validations: {metric.approved_validations}/{metric.total_authority_validations}</span>
                        <span>Pending: {metric.pending_validations}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {metric.average_review_duration_days && (
                          <span>Avg Review: {Math.round(metric.average_review_duration_days)} days</span>
                        )}
                        {metric.cultural_authority_satisfaction_score && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{metric.cultural_authority_satisfaction_score.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {complianceMetrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No compliance metrics available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Cultural Intelligence Summary
              </CardTitle>
              <CardDescription>
                Overview of cultural intelligence features by community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.map((community) => (
                  <div key={community.community_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{community.community_name}</h3>
                      <Badge variant="outline">
                        {community.total_insights} insights
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {community.insights_with_cultural_context}
                        </div>
                        <div className="text-xs text-gray-500">Cultural Contexts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {community.approved_validations}
                        </div>
                        <div className="text-xs text-gray-500">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {community.pending_validations}
                        </div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {community.high_risk_assessments}
                        </div>
                        <div className="text-xs text-gray-500">High Risk</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span>
                          Protocol Compliance: {community.compliant_protocols}/{community.protocol_compliance_checks}
                        </span>
                        {community.avg_cultural_impact_score && (
                          <span>
                            Avg Impact Score: {community.avg_cultural_impact_score.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500">
                        Validation Rate: {community.cultural_authority_validations > 0 ? 
                          Math.round((community.approved_validations / community.cultural_authority_validations) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}

                {summary.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No community summary data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}