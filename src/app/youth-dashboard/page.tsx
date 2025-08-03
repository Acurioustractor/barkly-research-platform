'use client';

import React, { useState } from 'react';
import { PageLayout, Container, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Progress } from '@/components/core';

interface YouthPriority {
  id: string;
  category: 'safe-house' | 'wellbeing' | 'education' | 'sports';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planning' | 'in-progress' | 'completed';
  youthVotes: number;
}

interface YouthStats {
  totalYouthEngaged: number;
  roundtableParticipants: number;
  prioritiesIdentified: number;
  safeHouseSupport: number;
  mentorConnections: number;
}

export default function YouthDashboard() {
  const [stats] = useState<YouthStats>({
    totalYouthEngaged: 89,
    roundtableParticipants: 17,
    prioritiesIdentified: 12,
    safeHouseSupport: 94,
    mentorConnections: 23
  });

  const [priorities] = useState<YouthPriority[]>([
    {
      id: '1',
      category: 'safe-house',
      title: 'Safe House for Youth',
      description: 'A safe place to rest, get food, laundry, transport home, counselling, experienced staff.',
      priority: 'high',
      status: 'planning',
      youthVotes: 15
    },
    {
      id: '2',
      category: 'wellbeing',
      title: 'Mental Health Support',
      description: 'More counsellors and mental health services specifically for young people in the Barkly.',
      priority: 'high',
      status: 'in-progress',
      youthVotes: 12
    }
  ]);

  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-green-50 to-emerald-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Youth Voice & Priorities</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Amplifying youth voices in the Barkly through the Youth Roundtable and priority-setting processes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Youth Roundtable</Button>
              <Button variant="secondary">Add Priority</Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.totalYouthEngaged}</p>
                  <p className="text-sm text-muted-foreground">Youth Engaged</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.roundtableParticipants}</p>
                  <p className="text-sm text-muted-foreground">Roundtable Members</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.prioritiesIdentified}</p>
                  <p className="text-sm text-muted-foreground">Priorities Identified</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.safeHouseSupport}%</p>
                  <p className="text-sm text-muted-foreground">Safe House Support</p>
                  <Progress value={stats.safeHouseSupport} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.mentorConnections}</p>
                  <p className="text-sm text-muted-foreground">Mentor Connections</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Youth-Identified Priorities</CardTitle>
              <CardDescription>
                Priorities identified through Youth Roundtable discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorities.map((priority) => (
                  <div key={priority.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{priority.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{priority.description}</p>
                      </div>
                      <Badge variant="success">High Priority</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}