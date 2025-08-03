'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import { Progress } from '@/components/core';

interface CTGTarget {
  id: string;
  category: 'education' | 'employment' | 'health' | 'justice' | 'housing' | 'leadership';
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  targetYear: number;
  trend: 'improving' | 'stable' | 'declining';
  priorityReform: string;
}

interface CTGStats {
  totalTargets: number;
  onTrackTargets: number;
  priorityReforms: number;
  communityLedInitiatives: number;
  dataCollectionPoints: number;
}

export default function CTGOutcomes() {
  const [stats, setStats] = useState<CTGStats>({
    totalTargets: 19,
    onTrackTargets: 12,
    priorityReforms: 4,
    communityLedInitiatives: 28,
    dataCollectionPoints: 156
  });

  const [targets, setTargets] = useState<CTGTarget[]>([
    {
      id: '1',
      category: 'education',
      title: 'Year 12 Attainment',
      description: 'Increase the proportion of Aboriginal students attaining Year 12 or equivalent',
      currentValue: 47,
      targetValue: 67,
      unit: '%',
      targetYear: 2031,
      trend: 'improving',
      priorityReform: 'Shared decision-making'
    },
    {
      id: '2',
      category: 'employment',
      title: 'Employment Rate',
      description: 'Increase Aboriginal employment rate to parity with non-Aboriginal Australians',
      currentValue: 49,
      targetValue: 62,
      unit: '%',
      targetYear: 2031,
      trend: 'improving',
      priorityReform: 'Building Aboriginal workforce'
    },
    {
      id: '3',
      category: 'health',
      title: 'Life Expectancy Gap',
      description: 'Close the gap in life expectancy between Aboriginal and non-Aboriginal Australians',
      currentValue: 8.6,
      targetValue: 0,
      unit: 'years',
      targetYear: 2031,
      trend: 'improving',
      priorityReform: 'Transforming government organizations'
    },
    {
      id: '4',
      category: 'justice',
      title: 'Youth Detention Rate',
      description: 'Reduce the rate of Aboriginal youth in detention',
      currentValue: 24.5,
      targetValue: 12.3,
      unit: 'per 10,000',
      targetYear: 2031,
      trend: 'stable',
      priorityReform: 'Shared decision-making'
    },
    {
      id: '5',
      category: 'housing',
      title: 'Overcrowding Rate',
      description: 'Reduce the rate of overcrowding in Aboriginal households',
      currentValue: 18,
      targetValue: 9,
      unit: '%',
      targetYear: 2031,
      trend: 'improving',
      priorityReform: 'Place-based partnerships'
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-500';
      case 'employment': return 'bg-green-500';
      case 'health': return 'bg-red-500';
      case 'justice': return 'bg-purple-500';
      case 'housing': return 'bg-orange-500';
      case 'leadership': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'improving': return <Badge variant="success">Improving</Badge>;
      case 'stable': return <Badge variant="secondary">Stable</Badge>;
      case 'declining': return <Badge variant="destructive">Declining</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateProgress = (current: number, target: number, isReverse: boolean = false) => {
    if (isReverse) {
      // For targets where lower is better (like life expectancy gap)
      const maxValue = Math.max(current, target) * 1.5;
      return ((maxValue - current) / maxValue) * 100;
    }
    return (current / target) * 100;
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-purple-50 to-indigo-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Closing the Gap Outcomes</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tracking progress against the 19 Closing the Gap targets and 4 Priority Reforms, 
              with a focus on Aboriginal-led solutions and community self-determination.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Data Dashboard</Button>
              <Button variant="secondary">Community Reports</Button>
              <Button variant="outline">Priority Reforms</Button>
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
                  <p className="text-2xl font-bold text-purple-600">{stats.totalTargets}</p>
                  <p className="text-sm text-muted-foreground">CTG Targets</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.onTrackTargets}</p>
                  <p className="text-sm text-muted-foreground">On Track</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.priorityReforms}</p>
                  <p className="text-sm text-muted-foreground">Priority Reforms</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.communityLedInitiatives}</p>
                  <p className="text-sm text-muted-foreground">Community Initiatives</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.dataCollectionPoints}</p>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Priority Reforms */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Four Priority Reforms</CardTitle>
              <CardDescription>
                Structural changes needed to achieve Closing the Gap targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-blue-600">Reform 1</h4>
                  </div>
                  <h5 className="font-medium">Shared Decision-Making</h5>
                  <p className="text-sm text-muted-foreground">
                    Formal partnership arrangements between governments and Aboriginal communities
                  </p>
                  <div className="text-xs">
                    <p>Barkly Progress:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Regional Deal partnership</li>
                      <li>• Youth Roundtable</li>
                      <li>• Community governance</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="font-semibold text-green-600">Reform 2</h4>
                  </div>
                  <h5 className="font-medium">Building Aboriginal Workforce</h5>
                  <p className="text-sm text-muted-foreground">
                    Strengthen and build the Aboriginal community-controlled sector
                  </p>
                  <div className="text-xs">
                    <p>Barkly Progress:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Training pathways</li>
                      <li>• Employment program</li>
                      <li>• Leadership development</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <h4 className="font-semibold text-orange-600">Reform 3</h4>
                  </div>
                  <h5 className="font-medium">Transforming Organizations</h5>
                  <p className="text-sm text-muted-foreground">
                    Improve mainstream institutions to be culturally safe and responsive
                  </p>
                  <div className="text-xs">
                    <p>Barkly Progress:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Cultural competency</li>
                      <li>• Service integration</li>
                      <li>• Two-way learning</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h4 className="font-semibold text-purple-600">Reform 4</h4>
                  </div>
                  <h5 className="font-medium">Shared Access to Data</h5>
                  <p className="text-sm text-muted-foreground">
                    Aboriginal communities have access to and control over their data
                  </p>
                  <div className="text-xs">
                    <p>Barkly Progress:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Community dashboards</li>
                      <li>• Local data collection</li>
                      <li>• Research partnerships</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Target Progress */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Target Progress Tracking</CardTitle>
              <CardDescription>
                Progress against key Closing the Gap targets relevant to the Barkly region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {targets.map((target) => (
                  <div key={target.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(target.category)}`}></div>
                          <h4 className="font-medium">{target.title}</h4>
                          {getTrendBadge(target.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{target.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Current Value</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {target.currentValue}{target.unit}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Target ({target.targetYear})</p>
                        <p className="text-2xl font-bold text-green-600">
                          {target.targetValue}{target.unit}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Progress</p>
                        <div className="space-y-2">
                          <Progress 
                            value={calculateProgress(
                              target.currentValue, 
                              target.targetValue, 
                              target.id === '3' || target.id === '4' // Reverse for life expectancy gap and detention rate
                            )} 
                            className="h-3" 
                          />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(calculateProgress(
                              target.currentValue, 
                              target.targetValue, 
                              target.id === '3' || target.id === '4'
                            ))}% to target
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Priority Reform</p>
                        <p className="text-sm">{target.priorityReform}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="ghost">Local Data</Button>
                      <Button size="sm" variant="ghost">Community Actions</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Barkly-Specific Outcomes */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Barkly Regional Outcomes</CardTitle>
                <CardDescription>
                  Local progress aligned with CTG targets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aboriginal employment rate</span>
                    <span className="font-medium">52% (↑3%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Training program completions</span>
                    <span className="font-medium">73% (↑8%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Youth engagement in education</span>
                    <span className="font-medium">85% (↑12%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Community-led initiatives</span>
                    <span className="font-medium">28 active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cultural mentoring connections</span>
                    <span className="font-medium">31 matches</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Key Success</p>
                  <p className="text-xs text-green-700 mt-1">
                    Youth engagement rates exceed national targets through culturally responsive programs
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Self-Determination</CardTitle>
                <CardDescription>
                  Aboriginal-led solutions and decision-making
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Governance Structures</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Regional Deal partnership, Youth Roundtable, Elder advisory groups
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Cultural Protocols</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Two-way learning, cultural mentoring, traditional knowledge integration
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Data Sovereignty</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Community-controlled data collection, local research partnerships
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Economic Development</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aboriginal business support, procurement opportunities, job creation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Action Areas */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data & Reporting</CardTitle>
                <CardDescription>Community-controlled data and reporting systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Data Dashboard</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement</CardTitle>
                <CardDescription>Strengthen community voice in CTG implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Engagement Hub</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Partnership Development</CardTitle>
                <CardDescription>Build partnerships for shared decision-making</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Partnership Portal</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}