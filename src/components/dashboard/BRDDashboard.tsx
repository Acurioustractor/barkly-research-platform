'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Progress } from '@/components/core';

interface BRDStats {
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
}

interface BRDDashboardProps {
  stats: BRDStats | null;
}

const BRDDashboard: React.FC<BRDDashboardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-500';
      case 'youth': return 'bg-green-500';
      case 'governance': return 'bg-purple-500';
      case 'employment': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'planning': return <Badge variant="secondary">Planning</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">BRD Initiatives</p>
                <p className="text-2xl font-bold">{stats.totalInitiatives}</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">28</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">10-year commitment</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employment Outcomes</p>
                <p className="text-2xl font-bold">{stats.employmentOutcomes}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">💼</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Jobs filled (New Jobs Program)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Youth Engagement</p>
                <p className="text-2xl font-bold">{stats.youthEngagement}%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">👥</span>
              </div>
            </div>
            <Progress value={stats.youthEngagement} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Training Programs</p>
                <p className="text-2xl font-bold">{stats.trainingPrograms}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">🎓</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active pathways</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Knowledge Base</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📚</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Documents processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Community Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across training, youth engagement, and governance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(activity.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Vision</CardTitle>
            <CardDescription>
              Barkly Regional Deal commitment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium text-primary mb-2">$100.5 Million</p>
              <p className="text-xs text-muted-foreground">10-year commitment</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-xs">Economic growth stimulation</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs">Social outcomes improvement</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-xs">Aboriginal leadership support</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs italic text-center">
                "Together determining our future and thriving in both worlds"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BRDDashboard;