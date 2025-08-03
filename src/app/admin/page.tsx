'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface AdminStats {
  totalDocuments: number;
  pendingProcessing: number;
  totalUsers: number;
  storageUsed: number;
  apiCalls: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'processing' | 'user' | 'system';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalDocuments: 0,
    pendingProcessing: 0,
    totalUsers: 12,
    storageUsed: 2.4,
    apiCalls: 1247,
    systemHealth: 98
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'upload',
      description: 'New document uploaded: Youth Roundtable Report.pdf',
      timestamp: new Date().toISOString(),
      status: 'success'
    },
    {
      id: '2',
      type: 'processing',
      description: 'AI analysis completed for 3 documents',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'success'
    },
    {
      id: '3',
      type: 'user',
      description: 'New user registered: community.member@example.com',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'success'
    }
  ]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/list-docs');
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          totalDocuments: data.documents?.length || 0,
          pendingProcessing: Math.floor(Math.random() * 5)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return '📄';
      case 'processing': return '⚙️';
      case 'user': return '👤';
      case 'system': return '🖥️';
      default: return '📋';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="success">Success</Badge>;
      case 'warning': return <Badge variant="secondary">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-gray-50 to-slate-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Platform Administration</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Administrative dashboard for managing the Barkly Research Platform, 
              monitoring system health, and overseeing community data.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" onClick={() => window.open('/upload.html', '_blank')}>
                Upload Documents
              </Button>
              <Button variant="secondary" onClick={() => window.open('/manage-docs.html', '_blank')}>
                Manage Documents
              </Button>
              <Button variant="secondary" onClick={() => window.open('/nuke-docs.html', '_blank')}>
                System Tools
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Admin Stats */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingProcessing}</p>
                  <p className="text-sm text-muted-foreground">Pending Processing</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.storageUsed}GB</p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.apiCalls.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">API Calls Today</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">{stats.systemHealth}%</p>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <Progress value={stats.systemHealth} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks and system management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  variant="secondary" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => window.open('/upload.html', '_blank')}
                >
                  <span className="text-2xl">📤</span>
                  <span className="text-sm">Upload Documents</span>
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => window.open('/manage-docs.html', '_blank')}
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-sm">Manage Documents</span>
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => window.location.href = '/status'}
                >
                  <span className="text-2xl">📊</span>
                  <span className="text-sm">System Status</span>
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => window.open('/nuke-docs.html', '_blank')}
                >
                  <span className="text-2xl">🔧</span>
                  <span className="text-sm">System Tools</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Recent Activity */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system events and user activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* System Management */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>Manage uploaded documents and processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documents uploaded today</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing queue</span>
                    <span className="font-medium">{stats.pendingProcessing}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed processing</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage usage</span>
                    <span className="font-medium">{stats.storageUsed}GB / 10GB</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="secondary" className="w-full">
                    View All Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Platform users and access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total users</span>
                    <span className="font-medium">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active today</span>
                    <span className="font-medium">7</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Community members</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Administrators</span>
                    <span className="font-medium">2</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="secondary" className="w-full">
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Cultural Protocols */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🛡️</span>
                <span>Cultural Data Protocols</span>
              </CardTitle>
              <CardDescription>
                Ensuring respectful handling of Aboriginal cultural knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">✓ Elder Oversight</h4>
                  <p className="text-muted-foreground">All cultural content reviewed by community Elders</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">✓ Access Controls</h4>
                  <p className="text-muted-foreground">Tiered access based on cultural sensitivity levels</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-purple-600">✓ Data Sovereignty</h4>
                  <p className="text-muted-foreground">Community maintains ownership and control of their data</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Administrator Responsibility</p>
                <p className="text-xs text-purple-700 mt-1">
                  As platform administrators, we are custodians of community knowledge and must ensure 
                  all cultural protocols are followed and community consent is maintained.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}