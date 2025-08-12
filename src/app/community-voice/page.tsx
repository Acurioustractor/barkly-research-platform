'use client';

import React from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import Link from 'next/link';

export default function CommunityVoicePage() {
  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-purple-50 to-pink-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Voice</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Share what you need, tell your story, and help us understand community priorities.
            </p>
            <div className="flex gap-4">
              <Link href="/community-input">
                <Button variant="primary">Share Your Voice</Button>
              </Link>
              <Link href="/outcomes">
                <Button variant="secondary">View Community Stories</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Share Community Priorities</span>
                </CardTitle>
                <CardDescription>
                  Tell us what matters most to your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Your input helps identify critical needs like youth safe houses, mental health support, and cultural programs.
                </p>
                <Link href="/community-input">
                  <Button variant="outline" className="w-full">Share Priorities</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📖</span>
                  <span>Tell Your Success Story</span>
                </CardTitle>
                <CardDescription>
                  Share what's working in your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Success stories inspire others and show funders the real impact of community programs.
                </p>
                <Link href="/community-input">
                  <Button variant="outline" className="w-full">Share Success</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🗣️</span>
                  <span>Join Community Conversations</span>
                </CardTitle>
                <CardDescription>
                  Participate in youth roundtables and consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Join respectful conversations that honour Indigenous knowledge and community protocols.
                </p>
                <Link href="/conversations">
                  <Button variant="outline" className="w-full">View Conversations</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Community Priorities</CardTitle>
              <CardDescription>What our community is talking about right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div>
                      <h4 className="font-semibold">Youth Safe House</h4>
                      <p className="text-sm text-muted-foreground">Safe place for young people when they need support</p>
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div>
                      <h4 className="font-semibold">Mental Health Support</h4>
                      <p className="text-sm text-muted-foreground">More counsellors and culturally appropriate services</p>
                    </div>
                    <Badge variant="secondary">High Priority</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div>
                      <h4 className="font-semibold">Cultural Mentoring Success</h4>
                      <p className="text-sm text-muted-foreground">87% completion rate with cultural mentors</p>
                    </div>
                    <Badge className="bg-green-500 text-white">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div>
                      <h4 className="font-semibold">Training Programs</h4>
                      <p className="text-sm text-muted-foreground">More pathways to employment and skills</p>
                    </div>
                    <Badge variant="secondary">Growing Support</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Your Voice Makes a Difference</CardTitle>
              <CardDescription>See the impact of community input</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">94%</div>
                  <div className="text-sm text-muted-foreground">Community support for youth safe house</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">247</div>
                  <div className="text-sm text-muted-foreground">Community voices captured in our platform</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">87%</div>
                  <div className="text-sm text-muted-foreground">Improvement in program outcomes through community feedback</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}