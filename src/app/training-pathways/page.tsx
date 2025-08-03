'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface TrainingPathway {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: 'certificate-i' | 'certificate-ii' | 'certificate-iii' | 'certificate-iv' | 'diploma';
  sector: 'construction' | 'community-services' | 'business' | 'health' | 'education' | 'mining';
  participants: number;
  completionRate: number;
  employmentOutcomes: number;
  culturalComponents: boolean;
  mentorSupport: boolean;
  status: 'active' | 'planning' | 'completed';
}

interface StudentJourney {
  id: string;
  studentName: string;
  pathway: string;
  stage: 'enrolled' | 'in-progress' | 'completed' | 'employed';
  progress: number;
  mentor: string | null;
  employer: string | null;
  startDate: string;
}

export default function TrainingPathways() {
  const [pathways, setPathways] = useState<TrainingPathway[]>([
    {
      id: '1',
      title: 'Certificate II in Community Services',
      provider: 'Barkly Regional Training',
      duration: '6 months',
      level: 'certificate-ii',
      sector: 'community-services',
      participants: 15,
      completionRate: 87,
      employmentOutcomes: 12,
      culturalComponents: true,
      mentorSupport: true,
      status: 'active'
    },
    {
      id: '2',
      title: 'Certificate III in Construction',
      provider: 'Territory Training Institute',
      duration: '12 months',
      level: 'certificate-iii',
      sector: 'construction',
      participants: 8,
      completionRate: 75,
      employmentOutcomes: 6,
      culturalComponents: true,
      mentorSupport: true,
      status: 'active'
    },
    {
      id: '3',
      title: 'Certificate IV in Business Administration',
      provider: 'Remote Learning Hub',
      duration: '8 months',
      level: 'certificate-iv',
      sector: 'business',
      participants: 12,
      completionRate: 92,
      employmentOutcomes: 10,
      culturalComponents: false,
      mentorSupport: true,
      status: 'active'
    }
  ]);

  const [studentJourneys, setStudentJourneys] = useState<StudentJourney[]>([
    {
      id: '1',
      studentName: 'Student A',
      pathway: 'Certificate II in Community Services',
      stage: 'in-progress',
      progress: 65,
      mentor: 'Elder Mary Johnson',
      employer: null,
      startDate: '2024-01-15'
    },
    {
      id: '2',
      studentName: 'Student B',
      pathway: 'Certificate III in Construction',
      stage: 'employed',
      progress: 100,
      mentor: 'Tradesman John Smith',
      employer: 'Local Building Co.',
      startDate: '2023-08-01'
    }
  ]);

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'construction': return 'bg-orange-500';
      case 'community-services': return 'bg-green-500';
      case 'business': return 'bg-blue-500';
      case 'health': return 'bg-red-500';
      case 'education': return 'bg-purple-500';
      case 'mining': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelBadge = (level: string) => {
    const levelMap = {
      'certificate-i': 'Cert I',
      'certificate-ii': 'Cert II',
      'certificate-iii': 'Cert III',
      'certificate-iv': 'Cert IV',
      'diploma': 'Diploma'
    };
    return <Badge variant="secondary">{levelMap[level as keyof typeof levelMap]}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'enrolled': return <Badge variant="outline">Enrolled</Badge>;
      case 'in-progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'employed': return <Badge variant="success">Employed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalStudents = pathways.reduce((sum, p) => sum + p.participants, 0);
  const avgCompletionRate = Math.round(pathways.reduce((sum, p) => sum + p.completionRate, 0) / pathways.length);
  const totalEmploymentOutcomes = pathways.reduce((sum, p) => sum + p.employmentOutcomes, 0);

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Training Pathways & Student Journeys</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Supporting Aboriginal people in the Barkly through culturally responsive training programs 
              that lead to meaningful employment opportunities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Add New Pathway</Button>
              <Button variant="secondary">Student Registry</Button>
              <Button variant="outline">Mentor Network</Button>
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
                  <p className="text-2xl font-bold text-blue-600">{pathways.length}</p>
                  <p className="text-sm text-muted-foreground">Active Pathways</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Current Students</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <Progress value={avgCompletionRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{totalEmploymentOutcomes}</p>
                  <p className="text-sm text-muted-foreground">Employment Outcomes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">31</p>
                  <p className="text-sm text-muted-foreground">Cultural Mentors</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Training Pathways */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Available Training Pathways</CardTitle>
              <CardDescription>
                Culturally responsive training programs designed with community input
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pathways.map((pathway) => (
                  <div key={pathway.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getSectorColor(pathway.sector)}`}></div>
                          <h4 className="font-medium">{pathway.title}</h4>
                          {getLevelBadge(pathway.level)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pathway.provider} • {pathway.duration}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Participants</p>
                        <p className="text-2xl font-bold text-blue-600">{pathway.participants}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-600">{pathway.completionRate}%</p>
                        <Progress value={pathway.completionRate} className="mt-1" />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Employment</p>
                        <p className="text-2xl font-bold text-orange-600">{pathway.employmentOutcomes}</p>
                        <p className="text-xs text-muted-foreground">jobs secured</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Cultural Components</p>
                        <p className="text-sm">{pathway.culturalComponents ? '✓ Yes' : '✗ No'}</p>
                        <p className="text-xs text-muted-foreground">Two-way learning</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Mentor Support</p>
                        <p className="text-sm">{pathway.mentorSupport ? '✓ Available' : '✗ Not available'}</p>
                        <p className="text-xs text-muted-foreground">Cultural mentoring</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="ghost">Student List</Button>
                      <Button size="sm" variant="ghost">Outcomes Report</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Student Journey Tracking */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Student Journey Tracking</CardTitle>
              <CardDescription>
                Individual student progress through training and into employment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentJourneys.map((journey) => (
                  <div key={journey.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{journey.studentName}</h4>
                        <p className="text-sm text-muted-foreground">{journey.pathway}</p>
                      </div>
                      {getStageBadge(journey.stage)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Progress</p>
                        <Progress value={journey.progress} className="mb-1" />
                        <p className="text-xs text-muted-foreground">{journey.progress}% complete</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Cultural Mentor</p>
                        <p>{journey.mentor || 'Not assigned'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Employer</p>
                        <p>{journey.employer || 'Seeking placement'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Start Date</p>
                        <p>{new Date(journey.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Update Progress</Button>
                      <Button size="sm" variant="ghost">Contact Student</Button>
                      <Button size="sm" variant="ghost">View Full Journey</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Cultural Integration */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cultural Integration</CardTitle>
                <CardDescription>Two-way learning and cultural mentoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Elder Knowledge Integration</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Traditional knowledge woven into modern training curricula
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Cultural Mentoring Program</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      31 active mentor-student relationships supporting cultural identity
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">On-Country Learning</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Practical training delivered in culturally significant locations
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Language Preservation</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Technical terminology developed in local Aboriginal languages
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pathway Success Factors</CardTitle>
                <CardDescription>What makes training programs effective</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cultural mentoring support</span>
                    <span className="font-medium">+23% completion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Flexible delivery modes</span>
                    <span className="font-medium">+18% retention</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employer partnerships</span>
                    <span className="font-medium">+31% employment</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wrap-around services</span>
                    <span className="font-medium">+15% completion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Community-based delivery</span>
                    <span className="font-medium">+27% engagement</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Key Insight</p>
                  <p className="text-xs text-green-700 mt-1">
                    Programs with cultural mentoring show significantly higher completion and employment rates
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
                <CardTitle>Student Support</CardTitle>
                <CardDescription>Wrap-around services and mentoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Support Services</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Employer Network</CardTitle>
                <CardDescription>Connect with local employers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Employer Portal</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cultural Mentors</CardTitle>
                <CardDescription>Elder and community mentor registry</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Mentor Network</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pathway Design</CardTitle>
                <CardDescription>Community-led curriculum development</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Design Hub</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}