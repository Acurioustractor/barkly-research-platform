'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { CommunityIntelligenceResult } from '@/lib/ai-service';

interface IntelligenceAnalyzerProps {
  className?: string;
}

export function IntelligenceAnalyzer({ className }: IntelligenceAnalyzerProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<CommunityIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          documentContext: 'Barkly Regional Deal community intelligence analysis',
          communityContext: 'Tennant Creek and surrounding Barkly region communities'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setIntelligence(data.intelligence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const renderIntelligenceSection = (title: string, items: any[], renderItem: (item: any, index: number) => React.ReactNode) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold text-lg mb-3 text-primary">{title}</h4>
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Community Intelligence Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="analysis-text" className="block text-sm font-medium mb-2">
                Text to Analyze
              </label>
              <textarea
                id="analysis-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter community-related text to analyze for intelligence insights..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical"
              />
            </div>

            <Button 
              onClick={analyzeText} 
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze Community Intelligence'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {intelligence && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Community Intelligence Analysis</h3>
                  
                  {/* Summary */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2 text-primary">Summary</h4>
                    <p className="text-gray-700">{intelligence.summary}</p>
                  </div>

                  {/* Community Needs */}
                  {renderIntelligenceSection(
                    'Community Needs',
                    intelligence.communityNeeds,
                    (need, index) => (
                      <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-blue-900">{need.need}</h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            need.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                            need.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                            need.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {need.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                          <strong>Community:</strong> {need.community} | 
                          <strong> Category:</strong> {need.category} | 
                          <strong> Confidence:</strong> {Math.round(need.confidence * 100)}%
                        </p>
                        {need.evidence.length > 0 && (
                          <div>
                            <strong className="text-sm text-blue-800">Evidence:</strong>
                            <ul className="text-sm text-blue-700 mt-1">
                              {need.evidence.map((evidence: string, i: number) => (
                                <li key={i} className="ml-4">• {evidence}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Service Gaps */}
                  {renderIntelligenceSection(
                    'Service Gaps',
                    intelligence.serviceGaps,
                    (gap, index) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-red-900">{gap.service}</h5>
                          <span className="text-sm text-red-700">Impact: {gap.impact}/10</span>
                        </div>
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Location:</strong> {gap.location} | 
                          <strong> Urgency:</strong> {gap.urgency}
                        </p>
                        {gap.recommendations.length > 0 && (
                          <div className="mb-2">
                            <strong className="text-sm text-red-800">Recommendations:</strong>
                            <ul className="text-sm text-red-700 mt-1">
                              {gap.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="ml-4">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Success Patterns */}
                  {renderIntelligenceSection(
                    'Success Patterns',
                    intelligence.successPatterns,
                    (pattern, index) => (
                      <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <h5 className="font-medium text-green-900 mb-2">{pattern.pattern}</h5>
                        <p className="text-sm text-green-700 mb-2">
                          <strong>Replicability:</strong> {Math.round(pattern.replicability * 100)}% | 
                          <strong> Communities:</strong> {pattern.communities.join(', ')}
                        </p>
                        {pattern.outcomes.length > 0 && (
                          <div>
                            <strong className="text-sm text-green-800">Outcomes:</strong>
                            <ul className="text-sm text-green-700 mt-1">
                              {pattern.outcomes.map((outcome: string, i: number) => (
                                <li key={i} className="ml-4">• {outcome}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Opportunities */}
                  {renderIntelligenceSection(
                    'Opportunities',
                    intelligence.opportunities,
                    (opp, index) => (
                      <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-purple-900">{opp.opportunity}</h5>
                          <span className="text-sm text-purple-700">Potential: {opp.potential}/10</span>
                        </div>
                        <p className="text-sm text-purple-700 mb-2">
                          <strong>Timeline:</strong> {opp.timeline} | 
                          <strong> Communities:</strong> {opp.communities.join(', ')}
                        </p>
                        {opp.requirements.length > 0 && (
                          <div>
                            <strong className="text-sm text-purple-800">Requirements:</strong>
                            <ul className="text-sm text-purple-700 mt-1">
                              {opp.requirements.map((req: string, i: number) => (
                                <li key={i} className="ml-4">• {req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Assets */}
                  {renderIntelligenceSection(
                    'Community Assets',
                    intelligence.assets,
                    (asset, index) => (
                      <div key={index} className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-indigo-900">{asset.asset}</h5>
                          <span className="text-sm text-indigo-700">Strength: {asset.strength}/10</span>
                        </div>
                        <p className="text-sm text-indigo-700 mb-2">
                          <strong>Type:</strong> {asset.type} | 
                          <strong> Communities:</strong> {asset.communities.join(', ')}
                        </p>
                        {asset.potential.length > 0 && (
                          <div>
                            <strong className="text-sm text-indigo-800">Potential:</strong>
                            <ul className="text-sm text-indigo-700 mt-1">
                              {asset.potential.map((pot: string, i: number) => (
                                <li key={i} className="ml-4">• {pot}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Traditional Analysis */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800">Traditional Analysis</h4>
                    
                    {intelligence.themes.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Themes</h5>
                        <div className="flex flex-wrap gap-2">
                          {intelligence.themes.map((theme: any, index: number) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                              {theme.name} ({Math.round(theme.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {intelligence.insights.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Key Insights</h5>
                        <ul className="space-y-2">
                          {intelligence.insights.map((insight: any, index: number) => (
                            <li key={index} className="text-sm text-gray-700">
                              <span className="font-medium">{insight.category}:</span> {insight.text}
                              <span className="text-gray-500 ml-2">(Importance: {insight.importance}/10)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}