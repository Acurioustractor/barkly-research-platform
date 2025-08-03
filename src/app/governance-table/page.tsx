'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface Initiative {
  id: string;
  title: string;
  category: 'economic' | 'social' | 'governance' | 'infrastructure' | 'cultural';
  description: string;
  leadAgency: string;
  partners: string[];
  budget: number;
  timeline: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  keyMilestones: string[];
  communityInput: boolean;
  youthEngagement: boolean;
  culturalProtocols: boolean;
  lastUpdated: string;
}

interface Decision {
  id: string;
  title: string;
  date: string;
  decisionMakers: string[];
  communityConsultation: boolean;
  outcome: string;
  relatedInitiatives: string[];
  implementationDate?: string;
  status: 'pending' | 'approved' | 'implemented' | 'under-review';
}

export default function GovernanceTable() {
  const [initiatives] = useState<Initiative[]>([
    {
      id: '1',
      title: 'Youth Safe House Development',
      category: 'social',
      description: 'Establish a safe house facility for young people in Tennant Creek with 24/7 support services',
      leadAgency: 'Territory Government',
      partners: ['Barkly Regional Council', 'Local Aboriginal Organizations', 'Youth Services'],
      budget: 2500000,
      timeline: '2024-2026',
      status: 'planning',
      progress: 25,
      keyMilestones: ['Site selection', 'Community consultation', 'Design phase', 'Construction', 'Service delivery'],
      communityInput: true,
      youthEngagement: true,
      culturalProtocols: true,
      lastUpdated: '2024-03-01'
    },
    {
      id: '2',
      title: 'Aboriginal Employment Program',
      category: 'economic',
      description: 'Create 100 new jobs for Aboriginal people across government and private sector',
      leadAgency: 'Department of Industry',
      partners: ['Local Employers', 'Training Providers', 'Community Organizations'],
      budget: 5000000,
      timeline: '2024-2027',
      status: 'in-progress',
      progress: 47,
      keyMilestones: ['Employer partnerships', 'Training pathways', 'Job placements', 'Mentoring support'],
      communityInput: true,
      youthEngagement: false,
      culturalProtocols: true,
      lastUpdated: '2024-02-28'
    },
    {
      id: '3',
      title: 'Cultural Tourism Development',
      category: 'economic',
      description: 'Develop Aboriginal-led cultural tourism experiences and infrastructure',
      leadAgency: 'Tourism NT',
      partners: ['Traditional Owners', 'Local Tourism Operators', 'Barkly Regional Council'],
      budget: 3200000,
      timeline: '2024-2028',
      status: 'in-progress',
      progress: 32,
      keyMilestones: ['Cultural protocols', 'Site development', 'Guide training', 'Marketing launch'],
      communityInput: true,
      youthEngagement: true,
      culturalProtocols: true,
      lastUpdated: '2024-02-25'
    }
  ]);

  const [decisions] = useState<Decision[]>([
    {
      id: '1',
      title: 'Youth Safe House Location Approval',
      date: '2024-02-15',
      decisionMakers: ['BRD Governance Board', 'Community Representatives', 'Youth Roundtable'],
      communityConsultation: true,
      outcome: 'Approved site on Paterson Street with community support',
      relatedInitiatives: ['1'],
      implementationDate: '2024-03-01',
      status: 'approved'
    },
    {
      id: '2',
      title: 'Employment Program Expansion',
      date: '2024-01-20',
      decisionMakers: ['BRD Governance Board', 'Department of Industry'],
      communityConsultation: true,
      outcome: 'Approved additional $2M funding for training pathways',
      relatedInitiatives: ['2'],
      implementationDate: '2024-02-01',
      status: 'implemented'
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'economic': return 'bg-green-500';
      case 'social': return 'bg-blue-500';
      case 'governance': return 'bg-purple-500';
      case 'infrastructure': return 'bg-orange-500';
      case 'cultural': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <Badge variant="outline">Planning</Badge>;
      case 'in-progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'on-hold': return <Badge variant="destructive">On Hold</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDecisionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'implemented': return <Badge variant="default">Implemented</Badge>;
      case 'under-review': return <Badge variant="secondary">Under Review</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalBudget = initiatives.reduce((sum, init) => sum + init.budget, 0);
  const avgProgress = Math.round(initiatives.reduce((sum, init) => sum + init.progress, 0) / initiatives.length);
  const activeInitiatives = initiatives.filter(init => init.status === 'in-progress').length;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-purple-50 to-indigo-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">BRD Governance Table</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tracking the 28 initiatives of the Barkly Regional Deal through transparent governance, 
              community accountability, and shared decision-making processes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Add Initiative</Button>
              <Button variant="secondary">Record Decision</Button>
              <Button variant="outline">Generate Report</Button>
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
                  <p className="text-2xl font-bold text-purple-600">28</p>
                  <p className="text-sm text-muted-foreground">Total Initiatives</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{activeInitiatives}</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${(totalBudget / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{avgProgress}%</p>
                  <p className="text-sm text-muted-foreground">Average Progress</p>
                  <Progress value={avgProgress} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{decisions.length}</p>
                  <p className="text-sm text-muted-foreground">Decisions Made</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* BRD Initiatives */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>BRD Initiative Tracking</CardTitle>
              <CardDescription>
                Progress on the 28 initiatives across economic, social, and governance outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {initiatives.map((initiative) => (
                  <div key={initiative.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(initiative.category)}`}></div>
                          <h4 className="font-medium">{initiative.title}</h4>
                          {getStatusBadge(initiative.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{initiative.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Lead Agency</p>
                        <p className="text-sm">{initiative.leadAgency}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Budget</p>
                        <p className="text-sm font-bold text-green-600">
                          ${(initiative.budget / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Timeline</p>
                        <p className="text-sm">{initiative.timeline}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Progress</p>
                        <div className="space-y-1">
                          <Progress value={initiative.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{initiative.progress}% complete</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Community Engagement</p>
                        <div className="space-y-1">
                          <p>Community Input: {initiative.communityInput ? '✓' : '✗'}</p>
                          <p>Youth Engagement: {initiative.youthEngagement ? '✓' : '✗'}</p>
                          <p>Cultural Protocols: {initiative.culturalProtocols ? '✓' : '✗'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Key Partners</p>
                        <ul className="text-xs space-y-1">
                          {initiative.partners.slice(0, 3).map((partner, index) => (
                            <li key={index}>• {partner}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Next Milestones</p>
                        <ul className="text-xs space-y-1">
                          {initiative.keyMilestones.slice(0, 3).map((milestone, index) => (
                            <li key={index}>• {milestone}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Update Progress</Button>
                      <Button size="sm" variant="ghost">View Details</Button>
                      <Button size="sm" variant="ghost">Community Report</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Decision Tracking */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Governance Decisions</CardTitle>
              <CardDescription>
                Transparent tracking of key decisions and their implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <div key={decision.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{decision.title}</h4>
                          {getDecisionStatusBadge(decision.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{decision.outcome}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Decision Date</p>
                        <p>{new Date(decision.date).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Community Consultation</p>
                        <p>{decision.communityConsultation ? '✓ Yes' : '✗ No'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Implementation</p>
                        <p>{decision.implementationDate ? new Date(decision.implementationDate).toLocaleDateString() : 'TBD'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Decision Makers</p>
                        <p className="text-xs">{decision.decisionMakers.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="ghost">Implementation Plan</Button>
                      <Button size="sm" variant="ghost">Community Impact</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Governance Framework */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>BRD Governance Structure</CardTitle>
                <CardDescription>Shared decision-making and accountability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">BRD Governance Board</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joint governance with Aboriginal community representatives and government
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Community Advisory Groups</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sector-specific advisory groups including youth, elders, and business
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Implementation Partners</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Government agencies, NGOs, and community organizations
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Community Accountability</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Regular community reporting and feedback mechanisms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Initiative Categories</CardTitle>
                <CardDescription>28 initiatives across five key areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Economic Development</span>
                    </div>
                    <span className="text-sm font-medium">8 initiatives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Social Outcomes</span>
                    </div>
                    <span className="text-sm font-medium">7 initiatives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Governance & Leadership</span>
                    </div>
                    <span className="text-sm font-medium">5 initiatives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Infrastructure</span>
                    </div>
                    <span className="text-sm font-medium">4 initiatives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm">Cultural Preservation</span>
                    </div>
                    <span className="text-sm font-medium">4 initiatives</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium text-primary">10-Year Commitment</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    $100.5M investment in community-led development and self-determination
                  </p>
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
                <CardTitle>Initiative Management</CardTitle>
                <CardDescription>Track and update initiative progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Initiatives</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Decision Recording</CardTitle>
                <CardDescription>Document governance decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Record Decision</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Reporting</CardTitle>
                <CardDescription>Generate public accountability reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Engagement</CardTitle>
                <CardDescription>Coordinate with partners and community</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Engagement Hub</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}