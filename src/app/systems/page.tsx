'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/core';
import { Container } from '@/components/core';
import { SystemsMap, DataRiver, ThemeRelationships } from '@/components/visualization';
import { DocumentSystemsMap } from '@/components/visualization/DocumentSystemsMap';
import { barklyYouthProject } from '@/data/projects/barkly-youth';
import { ProjectTransformer } from '@/data/transformers';
import { useSystemsMap } from '@/hooks/useSystemsMap';
import { Button } from '@/components/core/Button';
import { Card, CardContent } from '@/components/core/Card';

// Transform project data for visualizations
const systemNodes = [
  // Services
  { id: 'youth-hub', label: 'Youth Hub', type: 'service' as const },
  { id: 'education', label: 'Education Services', type: 'service' as const },
  { id: 'family-support', label: 'Family Support', type: 'service' as const },
  { id: 'cultural-programs', label: 'Cultural Programs', type: 'service' as const },
  
  // Themes
  { id: 'youth-voice', label: 'Youth Voice', type: 'theme' as const },
  { id: 'cultural-identity', label: 'Cultural Identity', type: 'theme' as const },
  { id: 'service-continuity', label: 'Service Continuity', type: 'theme' as const },
  
  // Outcomes
  { id: 'wellbeing', label: 'Youth Wellbeing', type: 'outcome' as const },
  { id: 'engagement', label: 'Community Engagement', type: 'outcome' as const },
  
  // Factors
  { id: 'funding', label: 'Funding Cycles', type: 'factor' as const },
  { id: 'staff-turnover', label: 'Staff Turnover', type: 'factor' as const }
];

const systemConnections = [
  { id: 'c1', from: 'youth-hub', to: 'youth-voice', type: 'enables' as const, strength: 'strong' as const, description: 'Hub provides platform for youth expression' },
  { id: 'c2', from: 'cultural-programs', to: 'cultural-identity', type: 'supports' as const, strength: 'strong' as const, description: 'Programs strengthen cultural connection' },
  { id: 'c3', from: 'funding', to: 'service-continuity', type: 'blocks' as const, strength: 'strong' as const, description: 'Short-term funding disrupts continuity' },
  { id: 'c4', from: 'youth-voice', to: 'wellbeing', type: 'influences' as const, strength: 'medium' as const, description: 'Being heard improves wellbeing' },
  { id: 'c5', from: 'cultural-identity', to: 'wellbeing', type: 'supports' as const, strength: 'strong' as const, description: 'Strong identity enhances wellbeing' },
  { id: 'c6', from: 'family-support', to: 'engagement', type: 'enables' as const, strength: 'medium' as const, description: 'Family involvement increases engagement' },
  { id: 'c7', from: 'staff-turnover', to: 'youth-voice', type: 'blocks' as const, strength: 'medium' as const, description: 'Turnover disrupts relationships' },
  { id: 'c8', from: 'education', to: 'cultural-identity', type: 'influences' as const, strength: 'weak' as const, description: 'Mixed impact on cultural connection' }
];

// Data for data river visualization
const dataStreams = [
  {
    name: 'Youth Participation',
    color: '#e85229',
    data: [20, 35, 45, 60, 55, 70, 75]
  },
  {
    name: 'Cultural Activities',
    color: '#0c9eeb',
    data: [30, 35, 40, 45, 50, 55, 60]
  },
  {
    name: 'Service Access',
    color: '#10b981',
    data: [40, 45, 35, 50, 45, 55, 50]
  },
  {
    name: 'Community Support',
    color: '#886859',
    data: [25, 30, 35, 40, 45, 50, 55]
  }
];

const timeLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

// Theme relationships data
const themeData = barklyYouthProject.themes.map(theme => ({
  theme: theme.title.split(' ').slice(0, 2).join(' '), // Shorten for display
  youthVoices: theme.youthVoices.length * 20, // Scale to percentage
  communitySupport: theme.communityVoices.length * 25,
  serviceAlignment: theme.supportingServices.length * 30,
  culturalRelevance: theme.culturalContext ? 80 : 40,
  actionPotential: theme.emergentPatterns ? theme.emergentPatterns.length * 25 : 20
}));

export default function SystemsPage() {
  const summaryStats = ProjectTransformer.generateSummaryStats(barklyYouthProject);
  const [mapView, setMapView] = useState<'demo' | 'documents'>('demo');
  const { data: systemsData, loading, error } = useSystemsMap({
    minConfidence: 0.5
  });

  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          {/* Page Header */}
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Systems Thinking
            </h1>
            <p className="text-lg text-muted-foreground">
              Visualize the complex relationships and patterns within the Barkly youth support ecosystem
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalParticipants}</p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Key Themes</p>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalThemes}</p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Youth Voices</p>
              <p className="text-2xl font-bold mt-1">{Math.round(summaryStats.youthQuotePercentage)}%</p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Actionable Insights</p>
              <p className="text-2xl font-bold mt-1">{summaryStats.actionableInsights}</p>
            </div>
          </div>

          {/* Map View Toggle */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Systems Map Data Source</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mapView === 'demo' 
                        ? 'Viewing example data to demonstrate system relationships'
                        : 'Viewing AI-extracted entities and relationships from uploaded documents'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={mapView === 'demo' ? 'primary' : 'secondary'}
                      onClick={() => setMapView('demo')}
                    >
                      Demo Data
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'documents' ? 'primary' : 'secondary'}
                      onClick={() => setMapView('documents')}
                    >
                      Document Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations */}
          <div className="space-y-8">
            {/* Systems Map */}
            {mapView === 'demo' ? (
              <SystemsMap
                nodes={systemNodes}
                connections={systemConnections}
                height={600}
              />
            ) : (
              <>
                {loading && (
                  <Card>
                    <CardContent className="p-12">
                      <div className="text-center">
                        <div className="animate-pulse">
                          <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
                          <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {error && (
                  <Card>
                    <CardContent className="p-12">
                      <div className="text-center">
                        <p className="text-destructive mb-4">Failed to load systems data: {error}</p>
                        <Button
                          variant="secondary"
                          onClick={() => window.location.href = '/admin#upload'}
                        >
                          Upload Documents
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!loading && !error && systemsData && (
                  <>
                    {systemsData.nodes.length === 0 ? (
                      <Card>
                        <CardContent className="p-12">
                          <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">No Systems Data Available</h3>
                            <p className="text-muted-foreground mb-4">
                              Upload documents with systems extraction enabled to generate a data-driven systems map.
                            </p>
                            <Button
                              onClick={() => window.location.href = '/admin#upload'}
                            >
                              Upload Documents
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <DocumentSystemsMap
                        nodes={systemsData.nodes}
                        connections={systemsData.connections}
                        documents={systemsData.documents}
                        height={600}
                        showConfidence={true}
                        showDocumentSources={true}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* Data River */}
            <DataRiver
              streams={dataStreams}
              labels={timeLabels}
              height={400}
            />

            {/* Theme Relationships */}
            <ThemeRelationships
              data={themeData}
              height={500}
            />
          </div>

          {/* Insights Summary */}
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Key System Insights</h2>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-medium mb-2">Interconnected Support</h3>
                <p className="text-muted-foreground">
                  The visualizations reveal how youth wellbeing is influenced by multiple interconnected factors. 
                  Cultural identity and youth voice emerge as central nodes with strong positive connections to outcomes.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-medium mb-2">Systemic Barriers</h3>
                <p className="text-muted-foreground">
                  Funding cycles and staff turnover create significant disruptions in the system, 
                  blocking the continuity needed for effective youth support.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-medium mb-2">Growth Opportunities</h3>
                <p className="text-muted-foreground">
                  The data shows increasing youth participation over time, suggesting that consistent 
                  engagement strategies are working when given the chance to develop.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}