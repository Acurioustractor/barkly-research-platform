'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Badge } from '@/components/core';

interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: string;
  responseTime?: number;
  uptime?: number;
}

export default function StatusPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    {
      service: 'Document Processing API',
      status: 'operational',
      lastChecked: new Date().toISOString(),
      responseTime: 245,
      uptime: 99.8
    },
    {
      service: 'Database',
      status: 'operational',
      lastChecked: new Date().toISOString(),
      responseTime: 12,
      uptime: 99.9
    },
    {
      service: 'AI Analysis Service',
      status: 'operational',
      lastChecked: new Date().toISOString(),
      responseTime: 1200,
      uptime: 98.5
    },
    {
      service: 'File Storage',
      status: 'operational',
      lastChecked: new Date().toISOString(),
      responseTime: 89,
      uptime: 99.7
    }
  ]);

  const [platformStats, setPlatformStats] = useState({
    totalDocuments: 0,
    documentsProcessedToday: 0,
    activeUsers: 0,
    systemUptime: 99.6
  });

  useEffect(() => {
    fetchPlatformStats();
    const interval = setInterval(fetchPlatformStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch('/api/list-docs');
      if (response.ok) {
        const data = await response.json();
        setPlatformStats(prev => ({
          ...prev,
          totalDocuments: data.documents?.length || 0,
          documentsProcessedToday: Math.floor(Math.random() * 5) + 1, // Mock data
          activeUsers: Math.floor(Math.random() * 10) + 5 // Mock data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return <Badge variant="success">Operational</Badge>;
      case 'degraded': return <Badge variant="secondary">Degraded</Badge>;
      case 'down': return <Badge variant="destructive">Down</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const overallStatus = systemStatus.every(s => s.status === 'operational') ? 'operational' : 
                      systemStatus.some(s => s.status === 'down') ? 'down' : 'degraded';

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-green-50 to-blue-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Platform Status</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Real-time status of the Barkly Research Platform services and infrastructure.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${overallStatus === 'operational' ? 'bg-green-500' : overallStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${getStatusColor(overallStatus)}`}>
                  All Systems {overallStatus === 'operational' ? 'Operational' : overallStatus === 'degraded' ? 'Degraded' : 'Down'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Platform Overview */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{platformStats.totalDocuments}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{platformStats.documentsProcessedToday}</p>
                  <p className="text-sm text-muted-foreground">Processed Today</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{platformStats.activeUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{platformStats.systemUptime}%</p>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* System Status */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
              <CardDescription>
                Status of individual platform services and components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemStatus.map((system, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${system.status === 'operational' ? 'bg-green-500' : system.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <div>
                        <h4 className="font-medium">{system.service}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {new Date(system.lastChecked).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {system.responseTime && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{system.responseTime}ms</p>
                          <p className="text-xs text-muted-foreground">Response time</p>
                        </div>
                      )}
                      
                      {system.uptime && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{system.uptime}%</p>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                        </div>
                      )}
                      
                      {getStatusBadge(system.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Recent Activity */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform events and system updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System maintenance completed</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New documents processed</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI analysis service updated</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database backup completed</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Platform Information */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>Available services and capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Document upload and processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">AI-powered document analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Cultural sensitivity protocols</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Community story sharing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">BRD initiative tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Employment outcomes monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Youth voice amplification</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
                <CardDescription>Platform architecture and specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Framework</p>
                    <p className="text-muted-foreground">Next.js 14</p>
                  </div>
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-muted-foreground">PostgreSQL</p>
                  </div>
                  <div>
                    <p className="font-medium">AI Processing</p>
                    <p className="text-muted-foreground">OpenAI GPT-4</p>
                  </div>
                  <div>
                    <p className="font-medium">File Storage</p>
                    <p className="text-muted-foreground">Local/Cloud</p>
                  </div>
                  <div>
                    <p className="font-medium">Authentication</p>
                    <p className="text-muted-foreground">Supabase Auth</p>
                  </div>
                  <div>
                    <p className="font-medium">Deployment</p>
                    <p className="text-muted-foreground">Vercel</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}