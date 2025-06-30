'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const ResearchInsights = dynamic(() => import('@/components/visualization/ResearchInsights'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>
});

const DocumentNetwork = dynamic(() => import('@/components/visualization/DocumentNetwork'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>
});

export default function InsightsPage() {
  const [activeView, setActiveView] = useState<'insights' | 'network'>('insights');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Research Insights</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Explore AI-generated insights, themes, and connections across your document repository.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveView('insights')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeView === 'insights'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Themes & Insights
          </button>
          <button
            onClick={() => setActiveView('network')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeView === 'network'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Document Network
          </button>
        </div>

        {/* Content */}
        {activeView === 'insights' ? (
          <ResearchInsights />
        ) : (
          <DocumentNetwork />
        )}
      </div>
    </div>
  );
}