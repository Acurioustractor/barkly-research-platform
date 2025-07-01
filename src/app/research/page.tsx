'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

const ResearchInsights = dynamic(() => import('@/components/visualization/ResearchInsights'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>
});

const DocumentNetwork = dynamic(() => import('@/components/visualization/DocumentNetwork'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>
});

export default function ResearchPage() {
  const [activeView, setActiveView] = useState<'insights' | 'network' | 'timeline'>('insights');

  const views = [
    { id: 'insights', label: 'Research Insights', description: 'Key themes, insights, and quotes from documents' },
    { id: 'network', label: 'Document Network', description: 'Visualize relationships between documents' },
    { id: 'timeline', label: 'Research Timeline', description: 'Track research evolution over time' }
  ];

  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Research Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Explore AI-powered insights from your document repository. Discover themes, relationships, 
            and strategic insights extracted from the research collection.
          </p>
        </div>

        {/* View Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as 'insights' | 'network' | 'timeline')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === view.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {view.label}
              </button>
            ))}
          </nav>
        </div>

        {/* View Content */}
        <div className="space-y-6">
          {activeView === 'insights' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Research Insights</h2>
                <p className="text-muted-foreground">
                  AI-generated insights, themes, and key quotes extracted from your document collection.
                </p>
              </div>
              
              <ResearchInsights />
            </div>
          )}

          {activeView === 'network' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Document Network</h2>
                <p className="text-muted-foreground">
                  Interactive visualization showing relationships between documents based on shared themes and content.
                </p>
              </div>
              
              <DocumentNetwork />
            </div>
          )}

          {activeView === 'timeline' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Research Timeline</h2>
                <p className="text-muted-foreground">
                  Track how research themes and insights have evolved over time.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                    <p className="text-muted-foreground mb-4">
                      Coming soon - Visualize research evolution and trends over time
                    </p>
                    <Button variant="secondary" disabled>
                      View Timeline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Research Tools</CardTitle>
            <CardDescription>Quick access to research analysis features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => window.location.href = '/admin#upload'}
              >
                Upload Documents
              </Button>
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => window.location.href = '/admin#analytics'}
              >
                View Analytics
              </Button>
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => window.location.href = '/admin#ai'}
              >
                Configure AI
              </Button>
            </div>
          </CardContent>
        </Card>
        </Container>
      </section>
    </PageLayout>
  );
}