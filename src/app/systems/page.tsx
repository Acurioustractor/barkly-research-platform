'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface SystemsChange {
  id: string;
  title: string;
  category: 'policy' | 'service-delivery' | 'funding' | 'governance' | 'cultural-competency';
  description: string;
  targetSystem: string;
  changeType: 'structural' | 'procedural' | 'cultural' | 'resource';
  status: 'identified' | 'in-progress' | 'implemented' | 'evaluated';
  impact: 'high' | 'medium' | 'low';
  stakeholders: string[];
  timeline: string;
  progress: number;
  barriers: string[];
  enablers: string[];
  outcomes: string[];
}

interface PolicyImpact {
  id: string;
  policyArea: string;
  changeDescription: string;
  impactLevel: 'local' | 'regional' | 'territory' | 'national';
  beneficiaries: number;
  implementationDate: string;
  status: 'proposed' | 'approved' | 'implemented' | 'evaluated';
}

export default function SystemsPage() {
  const [systemsChanges] = useState<SystemsChange[]>([
    {
      id: '1',
      title: 'Culturally Responsive Service Delivery Model',
      category: 'service-delivery',
      description: 'Transform mainstream services to be culturally safe and responsive to Aboriginal community needs',
      targetSystem: 'Health and Social Services',
      changeType: 'cultural',
      status: 'in-progress',
      impact: 'high',
      stakeholders: ['Territory Health', 'Community Organizations', 'Traditional Owners', 'Service Users'],
      timeline: '2024-2026',
      progress: 65,
      barriers: ['Staff turnover', 'Limited cultural training', 'Systemic resistance'],
      enablers: ['Community partnerships', 'Elder involvement', 'Staff commitment'],
      outcomes: ['Increased service uptake', 'Better health outcomes', 'Community trust']
    },
    {
      id: '2',
      title: 'Aboriginal Procurement Policy Reform',
      category: 'policy',
      description: 'Increase Aboriginal business participation in government procurement to 15%',
      targetSystem: 'Government Procurement',
      changeType: 'procedural',
      status: 'implemented',
      impact: 'high',
      stakeholders: ['Territory Government', 'Aboriginal Businesses', 'Procurement Officers'],
      timeline: '2023-2024',
      progress: 85,
      barriers: ['Limited business capacity', 'Complex processes'],
      enablers: ['Business support programs', 'Simplified processes', 'Dedicated support'],
      outcomes: ['$2.3M to Aboriginal businesses', '23 new contracts', 'Business growth']
    },
    {
      id: '3',
      title: 'Youth Justice Diversion Program',
      category: 'service-delivery',
      description: 'Implement culturally appropriate alternatives to youth detention',
      targetSystem: 'Justice System',
      changeType: 'structural',
      status: 'in-progress',
      impact: 'high',
      stakeholders: ['Territory Justice', 'Community Elders', 'Youth Services', 'Police'],
      timeline: '2024-2025',
      progress: 40,
      barriers: ['Legal framework constraints', 'Resource limitations'],
      enablers: ['Community support', 'Elder involvement', 'Evidence base'],
      outcomes: ['Reduced detention rates', 'Better youth outcomes', 'Community healing']
    }
  ]);

  const [policyImpacts] = useState<PolicyImpact[]>([
    {
      id: '1',
      policyArea: 'Employment Services',
      changeDescription: 'Mandatory cultural competency training for all employment service providers',
      impactLevel: 'territory',
      beneficiaries: 450,
      implementationDate: '2024-01-15',
      status: 'implemented'
    },
    {
      id: '2',
      policyArea: 'Education',
      changeDescription: 'Two-way learning curriculum integration in all Barkly schools',
      impactLevel: 'regional',
      beneficiaries: 1200,
      implementationDate: '2024-07-01',
      status: 'approved'
    },
    {
      id: '3',
      policyArea: 'Housing',
      changeDescription: 'Community-controlled housing management model',
      impactLevel: 'local',
      beneficiaries: 180,
      implementationDate: '2024-09-01',
      status: 'proposed'
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'policy': return 'bg-blue-500';
      case 'service-delivery': return 'bg-green-500';
      case 'funding': return 'bg-orange-500';
      case 'governance': return 'bg-purple-500';
      case 'cultural-competency': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low': return <Badge variant="outline">Low Impact</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'identified': return <Badge variant="outline">Identified</Badge>;
      case 'in-progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'implemented': return <Badge variant="success">Implemented</Badge>;
      case 'evaluated': return <Badge variant="default">Evaluated</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPolicyStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed': return <Badge variant="outline">Proposed</Badge>;
      case 'approved': return <Badge variant="secondary">Approved</Badge>;
      case 'implemented': return <Badge variant="success">Implemented</Badge>;
      case 'evaluated': return <Badge variant="default">Evaluated</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalBeneficiaries = policyImpacts.reduce((sum, policy) => sum + policy.beneficiaries, 0);
  const implementedChanges = systemsChanges.filter(change => change.status === 'implemented').length;
  const avgProgress = Math.round(systemsChanges.reduce((sum, change) => sum + change.progress, 0) / systemsChanges.length);

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-indigo-50 to-blue-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Systems Change & Policy Impact</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tracking systemic changes in government and service delivery systems to improve 
              outcomes for Aboriginal people in the Barkly region.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Identify System Change</Button>
              <Button variant="secondary">Policy Tracker</Button>
              <Button variant="outline">Impact Assessment</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Metrics */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{systemsChanges.length}</p>
                  <p className="text-sm text-muted-foreground">Systems Changes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{implementedChanges}</p>
                  <p className="text-sm text-muted-foreground">Implemented</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{avgProgress}%</p>
                  <p className="text-sm text-muted-foreground">Average Progress</p>
                  <Progress value={avgProgress} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{policyImpacts.length}</p>
                  <p className="text-sm text-muted-foreground">Policy Changes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{totalBeneficiaries.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">People Impacted</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Systems Change Tracking */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Systems Change Initiatives</CardTitle>
              <CardDescription>
                Tracking structural, procedural, and cultural changes across government systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(systemsChanges || []).map((change) => (
                  <div key={change.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(change.category)}`}></div>
                          <h4 className="font-medium">{change.title}</h4>
                          {getImpactBadge(change.impact)}
                          {getStatusBadge(change.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{change.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Target System</p>
                        <p className="text-sm">{change.targetSystem}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Change Type</p>
                        <p className="text-sm capitalize">{change.changeType}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Timeline</p>
                        <p className="text-sm">{change.timeline}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Progress</p>
                        <div className="space-y-1">
                          <Progress value={change.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{change.progress}% complete</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2 text-red-600">Barriers</p>
                        <ul className="text-xs space-y-1">
                          {(change.barriers || []).slice(0, 3).map((barrier, index) => (
                            <li key={index}>• {barrier}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2 text-green-600">Enablers</p>
                        <ul className="text-xs space-y-1">
                          {(change.enablers || []).slice(0, 3).map((enabler, index) => (
                            <li key={index}>• {enabler}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2 text-blue-600">Expected Outcomes</p>
                        <ul className="text-xs space-y-1">
                          {(change.outcomes || []).slice(0, 3).map((outcome, index) => (
                            <li key={index}>• {outcome}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Key Stakeholders</p>
                      <div className="flex flex-wrap gap-1">
                        {(change.stakeholders || []).map((stakeholder, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Update Progress</Button>
                      <Button size="sm" variant="ghost">View Details</Button>
                      <Button size="sm" variant="ghost">Impact Report</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Policy Impact Tracking */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Policy Impact Tracker</CardTitle>
              <CardDescription>
                Monitoring policy changes and their impact on Aboriginal communities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(policyImpacts || []).map((policy) => (
                  <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{policy.policyArea}</h4>
                          {getPolicyStatusBadge(policy.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{policy.changeDescription}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Impact Level</p>
                        <p className="capitalize">{policy.impactLevel}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Beneficiaries</p>
                        <p className="font-bold text-green-600">{policy.beneficiaries.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Implementation</p>
                        <p>{new Date(policy.implementationDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Status</p>
                        <p className="capitalize">{policy.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Policy</Button>
                      <Button size="sm" variant="ghost">Impact Assessment</Button>
                      <Button size="sm" variant="ghost">Community Feedback</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Systems Map */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Government Systems Map</CardTitle>
                <CardDescription>Key systems requiring transformation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Health & Social Services</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cultural safety, service integration, community control
                    </p>
                    <div className="mt-2">
                      <Progress value={65} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">65% transformed</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Education System</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Two-way learning, cultural curriculum, community involvement
                    </p>
                    <div className="mt-2">
                      <Progress value={45} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">45% transformed</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Justice System</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diversion programs, cultural courts, community justice
                    </p>
                    <div className="mt-2">
                      <Progress value={30} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">30% transformed</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Employment Services</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cultural competency, Aboriginal providers, job creation
                    </p>
                    <div className="mt-2">
                      <Progress value={70} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">70% transformed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Change Strategies</CardTitle>
                <CardDescription>Approaches to systems transformation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">Structural Changes</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      New governance models, funding mechanisms, service structures
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-sm text-green-800">Cultural Transformation</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Cultural competency, two-way learning, respectful relationships
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-sm text-purple-800">Procedural Reform</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      Simplified processes, community-friendly approaches, accessibility
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-sm text-orange-800">Resource Reallocation</h4>
                    <p className="text-xs text-orange-700 mt-1">
                      Community-controlled funding, Aboriginal procurement, capacity building
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Analysis</CardTitle>
                <CardDescription>Identify systems needing transformation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Analyze Systems</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Policy Tracking</CardTitle>
                <CardDescription>Monitor policy changes and impacts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Track Policies</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Engagement</CardTitle>
                <CardDescription>Coordinate with government partners</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Engage Stakeholders</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Impact Assessment</CardTitle>
                <CardDescription>Measure systems change effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Assess Impact</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}