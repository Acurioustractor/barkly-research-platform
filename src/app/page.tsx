'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import BRDDashboard from '@/components/dashboard/BRDDashboard';
import Link from 'next/link';
import { Badge } from '@/components/core/Badge';

export default function Home() {
  const [brdStats, setBrdStats] = useState<{
    totalDocuments: number;
    totalInitiatives: number;
    youthEngagement: number;
    trainingPrograms: number;
    employmentOutcomes: number;
    recentActivity: Array<{
      id: string;
      title: string;
      type: 'training' | 'youth' | 'governance' | 'employment';
      date: string;
      status: 'active' | 'completed' | 'planning';
    }>;
  } | null>(null);

  useEffect(() => {
    fetchBRDData();
  }, []);

  const fetchBRDData = async () => {
    try {
      // Mock BRD-specific data for now since documents API requires auth
      setBrdStats({
        totalDocuments: 0, // Will be updated when auth is implemented
        totalInitiatives: 28, // From BRD framework
        youthEngagement: 85, // Percentage from youth roundtables
        trainingPrograms: 12, // Active training pathways
        employmentOutcomes: 47, // Jobs filled from New Jobs Program
        recentActivity: [
          {
            id: '1',
            title: 'Youth Roundtable Outcomes Processed',
            type: 'youth',
            date: new Date().toLocaleDateString(),
            status: 'completed'
          },
          {
            id: '2', 
            title: 'Training Pathways Strategy Updated',
            type: 'training',
            date: new Date().toLocaleDateString(),
            status: 'active'
          },
          {
            id: '3',
            title: 'CTG Outcomes Framework Aligned',
            type: 'governance',
            date: new Date().toLocaleDateString(),
            status: 'active'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch BRD data:', error);
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-8 lg:py-12 bg-gradient-to-b from-primary/5 to-background">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Tennant Creek Services & Support
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              <em>"See what's available, what's missing, and what's planned for our community"</em>
            </p>
            <p className="text-base text-muted-foreground mb-6 max-w-3xl mx-auto">
              Find services, share what you need, and help us understand the gaps so we can work together to fill them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services-map">
                <Button size="lg" variant="primary">🗺️ View Services Map</Button>
              </Link>
              <Link href="/community-voice">
                <Button size="lg" variant="secondary">🗣️ Share What You Need</Button>
              </Link>
              <Link href="/support">
                <Button size="lg" variant="ghost">🤝 Get Help Now</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Community Priority Widget */}
      <section className="py-8 bg-gradient-to-r from-green-50 to-blue-50">
        <Container>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">What's Important to Our Community Right Now</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These are the priorities our community is talking about most. Add your voice or vote on what matters to you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Youth Safe House</CardTitle>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
                <CardDescription>Safe place for young people when they need support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Community Support</span>
                  <span className="font-bold text-red-600">94%</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">👍 Support (234)</Button>
                  <Button size="sm" variant="ghost" className="flex-1">💬 Discuss</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mental Health Support</CardTitle>
                  <Badge variant="secondary">High Priority</Badge>
                </div>
                <CardDescription>More counsellors and culturally appropriate mental health services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Community Support</span>
                  <span className="font-bold text-orange-600">87%</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">👍 Support (189)</Button>
                  <Button size="sm" variant="ghost" className="flex-1">💬 Discuss</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Cultural Mentoring</CardTitle>
                  <Badge variant="success">Success Story</Badge>
                </div>
                <CardDescription>Expanding cultural mentoring in training programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Community Support</span>
                  <span className="font-bold text-green-600">91%</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">👍 Support (156)</Button>
                  <Button size="sm" variant="ghost" className="flex-1">💬 Discuss</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Link href="/community-input">
              <Button variant="primary" size="lg">Add Your Priority</Button>
            </Link>
            <span className="mx-4 text-muted-foreground">or</span>
            <Link href="/heat-map">
              <Button variant="outline" size="lg">View All Priorities</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* BRD Dashboard */}
      <section className="py-8">
        <Container>
          <BRDDashboard stats={brdStats} />
        </Container>
      </section>

      {/* Community Conversation Highlights */}
      <section className="py-8">
        <Container>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Community Conversations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Highlights from recent community consultations, youth roundtables, and success stories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">Youth Safe House Priority</CardTitle>
                <CardDescription>Youth Roundtable - March 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  "We need somewhere safe to go when things get tough at home" - Strong community priority identified
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">High Priority</Badge>
                  <span className="text-xs text-muted-foreground">17 participants</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Cultural Mentoring Success</CardTitle>
                <CardDescription>Employment Success Story</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  "Having Uncle Billy as my cultural mentor made all the difference" - 87% completion rate with mentoring
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Success Story</Badge>
                  <span className="text-xs text-muted-foreground">Public</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">Health Services Transformation</CardTitle>
                <CardDescription>Systems Change Case Study</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Patient satisfaction improved from 34% to 67% through community-led cultural transformation
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Systems Change</Badge>
                  <span className="text-xs text-muted-foreground">Community</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Link href="/heat-map">
              <Button variant="outline">View Community Heat Map →</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* BRD Intelligence Features */}
      <section className="py-12 bg-muted/30">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We're Making Progress Together</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track progress on community priorities and see how your voice is making a difference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🎓 Training & Jobs</CardTitle>
                <CardDescription>
                  Find training opportunities and see success stories from your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/training-pathways" className="w-full">
                  <Button variant="ghost" className="w-full">Explore Opportunities →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>👥 Youth Leadership</CardTitle>
                <CardDescription>
                  Young people leading change and connecting with peers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/youth-dashboard" className="w-full">
                  <Button variant="ghost" className="w-full">Youth Hub →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Community Progress</CardTitle>
                <CardDescription>
                  See how community priorities are being addressed and making progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ctg-outcomes" className="w-full">
                  <Button variant="ghost" className="w-full">Track Progress →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🤝 Community Decisions</CardTitle>
                <CardDescription>
                  Transparent tracking of decisions and how community input influences them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/governance-table" className="w-full">
                  <Button variant="ghost" className="w-full">See Decisions →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔄 Making Change Happen</CardTitle>
                <CardDescription>
                  How community advocacy is changing government services and policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/systems" className="w-full">
                  <Button variant="ghost" className="w-full">See Changes →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏘️ Community Stories</CardTitle>
                <CardDescription>
                  Share your experiences and learn from others in your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/stories" className="w-full">
                  <Button variant="ghost" className="w-full">Read & Share →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💼 Job Success Stories</CardTitle>
                <CardDescription>
                  Celebrate employment successes and find pathways to work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employment-outcomes" className="w-full">
                  <Button variant="ghost" className="w-full">Success Stories →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📚 Community Knowledge</CardTitle>
                <CardDescription>
                  Access community research and documents with cultural protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/documents" className="w-full">
                  <Button variant="ghost" className="w-full">Explore Library →</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}