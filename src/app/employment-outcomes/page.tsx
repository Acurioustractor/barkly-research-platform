'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface EmploymentOutcome {
  id: string;
  participantName: string;
  program: string;
  employer: string;
  jobTitle: string;
  startDate: string;
  employmentType: 'full-time' | 'part-time' | 'casual' | 'apprenticeship';
  sector: 'construction' | 'community-services' | 'retail' | 'government' | 'mining' | 'other';
  status: 'active' | 'completed' | 'transitioned';
  culturalMentoring: boolean;
}

interface EmploymentStats {
  totalPlacements: number;
  activeEmployment: number;
  retentionRate: number;
  averageWage: number;
  localBusinesses: number;
  culturalMentoring: number;
}

export default function EmploymentOutcomes() {
  const [stats, setStats] = useState<EmploymentStats>({
    totalPlacements: 47,
    activeEmployment: 39,
    retentionRate: 83,
    averageWage: 52000,
    localBusinesses: 18,
    culturalMentoring: 31
  });

  const [outcomes, setOutcomes] = useState<EmploymentOutcome[]>([
    {
      id: '1',
      participantName: 'Participant A',
      program: 'Certificate II Community Services',
      employer: 'Barkly Regional Council',
      jobTitle: 'Community Support Worker',
      startDate: '2024-01-15',
      employmentType: 'full-time',
      sector: 'community-services',
      status: 'active',
      culturalMentoring: true
    },
    {
      id: '2',
      participantName: 'Participant B',
      program: 'Construction Apprenticeship',
      employer: 'Local Building Co.',
      jobTitle: 'Apprentice Carpenter',
      startDate: '2023-08-01',
      employmentType: 'apprenticeship',
      sector: 'construction',
      status: 'active',
      culturalMentoring: true
    },
    {
      id: '3',
      participantName: 'Participant C',
      program: 'VET Pathways',
      employer: 'Territory Government',
      jobTitle: 'Administrative Assistant',
      startDate: '2024-02-01',
      employmentType: 'part-time',
      sector: 'government',
      status: 'active',
      culturalMentoring: false
    }
  ]);

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'construction': return 'bg-orange-500';
      case 'community-services': return 'bg-green-500';
      case 'retail': return 'bg-blue-500';
      case 'government': return 'bg-purple-500';
      case 'mining': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case 'full-time': return <Badge variant="success">Full-time</Badge>;
      case 'part-time': return <Badge variant="secondary">Part-time</Badge>;
      case 'casual': return <Badge variant="outline">Casual</Badge>;
      case 'apprenticeship': return <Badge variant="default">Apprenticeship</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'transitioned': return <Badge variant="secondary">Transitioned</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-orange-50 to-amber-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Employment Outcomes & New Jobs Program</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tracking employment outcomes from training programs and supporting the creation of 
              new jobs for Aboriginal people in the Barkly region.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Add Employment Outcome</Button>
              <Button variant="secondary">Employer Registry</Button>
              <Button variant="outline">Generate Report</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Metrics */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.totalPlacements}</p>
                  <p className="text-sm text-muted-foreground">Total Job Placements</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.activeEmployment}</p>
                  <p className="text-sm text-muted-foreground">Currently Employed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.retentionRate}%</p>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                  <Progress value={stats.retentionRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">${(stats.averageWage / 1000).toFixed(0)}k</p>
                  <p className="text-sm text-muted-foreground">Average Wage</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.localBusinesses}</p>
                  <p className="text-sm text-muted-foreground">Partner Employers</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">{stats.culturalMentoring}</p>
                  <p className="text-sm text-muted-foreground">Cultural Mentoring</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* New Jobs Program */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>New Jobs Program</CardTitle>
              <CardDescription>
                Creating sustainable employment opportunities for Aboriginal people in the Barkly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600">Job Creation Focus</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Community services roles</li>
                    <li>• Local government positions</li>
                    <li>• Construction & maintenance</li>
                    <li>• Cultural tourism</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">Employer Support</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Wage subsidies</li>
                    <li>• Cultural awareness training</li>
                    <li>• Mentoring programs</li>
                    <li>• Flexible work arrangements</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">Employee Support</h4>
                  <ul className="text-sm space-y-1">
                    <li>• On-job training</li>
                    <li>• Cultural mentoring</li>
                    <li>• Career development</li>
                    <li>• Wrap-around services</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-600">Success Measures</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Job retention rates</li>
                    <li>• Career progression</li>
                    <li>• Employer satisfaction</li>
                    <li>• Community impact</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Employment Outcomes Tracking */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Employment Outcomes Tracking</CardTitle>
              <CardDescription>
                Individual employment outcomes from training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outcomes.map((outcome) => (
                  <div key={outcome.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{outcome.participantName}</h4>
                        <p className="text-sm text-muted-foreground">{outcome.jobTitle} at {outcome.employer}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getEmploymentTypeBadge(outcome.employmentType)}
                        {getStatusBadge(outcome.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Training Program</p>
                        <p>{outcome.program}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Sector</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getSectorColor(outcome.sector)}`}></div>
                          <p className="capitalize">{outcome.sector.replace('-', ' ')}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Start Date</p>
                        <p>{new Date(outcome.startDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Cultural Support</p>
                        <p>{outcome.culturalMentoring ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Update Status</Button>
                      <Button size="sm" variant="ghost">View Details</Button>
                      <Button size="sm" variant="ghost">Contact Employer</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Sector Analysis */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment by Sector</CardTitle>
                <CardDescription>Distribution of job placements across industries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Community Services</span>
                    </div>
                    <span className="text-sm font-medium">15 jobs (32%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Construction</span>
                    </div>
                    <span className="text-sm font-medium">12 jobs (26%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Government</span>
                    </div>
                    <span className="text-sm font-medium">10 jobs (21%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Retail</span>
                    </div>
                    <span className="text-sm font-medium">6 jobs (13%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Other</span>
                    </div>
                    <span className="text-sm font-medium">4 jobs (8%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Employer Partnerships</CardTitle>
                <CardDescription>Key employers supporting Aboriginal employment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Barkly Regional Council</h4>
                    <p className="text-xs text-muted-foreground">8 placements • Community services focus</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Territory Government</h4>
                    <p className="text-xs text-muted-foreground">6 placements • Administrative & service roles</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Local Construction Companies</h4>
                    <p className="text-xs text-muted-foreground">12 placements • Apprenticeships & trades</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Community Organizations</h4>
                    <p className="text-xs text-muted-foreground">9 placements • Cultural & social services</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employer Engagement</CardTitle>
                <CardDescription>Connect with local employers for job opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Employer Portal</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Career Development</CardTitle>
                <CardDescription>Support career progression and skills development</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Development Plans</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cultural Mentoring</CardTitle>
                <CardDescription>Workplace cultural support and mentoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Mentor Network</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}