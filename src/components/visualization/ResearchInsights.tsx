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

  // Show empty state if no data
  if (!data || (themes.length === 0 && insights.length === 0 && quotes.length === 0)) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Research Insights Available</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              AI-powered insights will appear here once documents have been processed with theme and quote extraction. 
              Upload documents with AI analysis enabled to generate insights.
            </p>
            <div className="space-y-3">
              <a 
                href="/documents" 
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Documents
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Sample Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Preview: What You'll See</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 opacity-60">
              {/* Sample Themes */}
              <div>
                <h4 className="font-medium mb-3">Example Themes</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: 'Youth Voice and Leadership', color: 'bg-blue-500', confidence: 85 },
                    { name: 'Cultural Identity', color: 'bg-purple-500', confidence: 78 },
                    { name: 'Community Development', color: 'bg-green-500', confidence: 92 }
                  ].map((theme) => (
                    <div key={theme.name} className="p-3 border-2 border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-3 h-3 rounded-full ${theme.color}`}></div>
                        <span className="text-sm text-gray-500">3 docs</span>
                      </div>
                      <h5 className="font-medium text-sm">{theme.name}</h5>
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${theme.color}`} style={{ width: `${theme.confidence}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{theme.confidence}% confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Insight */}
              <div>
                <h4 className="font-medium mb-3">Example Strategic Insight</h4>
                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                  <p className="font-medium text-sm">Youth participants consistently emphasize the importance of culturally responsive programming that acknowledges their unique experiences and perspectives.</p>
                  <p className="text-sm text-gray-600 mt-1">From: Youth Roundtable Report</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Youth Voice and Leadership
                    </span>
                    <span>Confidence: 87%</span>
                  </div>
                </div>
              </div>

              {/* Sample Quote */}
              <div>
                <h4 className="font-medium mb-3">Example Notable Quote</h4>
                <blockquote className="border-l-4 border-gray-300 pl-4 bg-gray-50 py-2">
                  <p className="italic">&ldquo;We want programs that understand where we come from and help us build on our strengths, not just focus on what we're lacking.&rdquo;</p>
                  <footer className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">— Youth Participant</span>
                    <span className="ml-2">(Focus Group Discussion)</span>
                  </footer>
                </blockquote>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      <div className={`w-2 h-2 rounded-full ${getThemeColor(insight.type)}`}></div>
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