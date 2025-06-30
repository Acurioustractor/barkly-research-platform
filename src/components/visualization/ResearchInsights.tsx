'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core/Card';
import { useDocumentInsights } from '@/hooks/useDocumentInsights';


export default function ResearchInsights() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const { data, loading } = useDocumentInsights(selectedTheme || undefined);

  const themes = data?.themes || [];
  const insights = data?.insights || [];
  const quotes = data?.quotes || [];

  const getThemeColor = (theme: string) => {
    const colors: Record<string, string> = {
      'Youth Voice and Leadership': 'bg-blue-500',
      'Cultural Identity': 'bg-purple-500',
      'Education and Learning': 'bg-green-500',
      'Community Development': 'bg-orange-500',
      'Health and Well-being': 'bg-pink-500',
      'Technology and Innovation': 'bg-indigo-500',
      'Environmental Sustainability': 'bg-teal-500',
      'Social Justice and Equity': 'bg-red-500'
    };
    return colors[theme] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Theme Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Themes Identified</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => setSelectedTheme(theme.name === selectedTheme ? null : theme.name)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === theme.name 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-3 h-3 rounded-full ${getThemeColor(theme.name)}`}></div>
                  <span className="text-sm text-gray-500">{theme.count} docs</span>
                </div>
                <h3 className="font-medium text-left">{theme.name}</h3>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getThemeColor(theme.name)}`}
                      style={{ width: `${theme.avgConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {(theme.avgConfidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights
              .filter(insight => !selectedTheme || insight.type === selectedTheme)
              .map((insight, idx) => (
                <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                  <p className="font-medium">{insight.text}</p>
                  <p className="text-sm text-gray-600 mt-1">From: {insight.documentName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getThemeColor(insight.theme)}`}></div>
                      {insight.type}
                    </span>
                    <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Notable Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Notable Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quotes
              .map((quote, idx) => (
                <blockquote key={idx} className="border-l-4 border-gray-300 pl-4">
                  <p className="italic text-lg mb-2">&ldquo;{quote.text}&rdquo;</p>
                  <footer className="text-sm text-gray-600">
                    {quote.speaker && <span className="font-medium">— {quote.speaker}</span>}
                    {quote.context && <span className="ml-2">({quote.context})</span>}
                  </footer>
                  <div className="mt-2 text-xs text-gray-500">
                    From: {quote.documentName}
                  </div>
                </blockquote>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}