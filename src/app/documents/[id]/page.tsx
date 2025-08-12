'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core/Badge';
import Link from 'next/link';

interface DocumentReview {
  document: {
    id: string;
    title: string;
    file_type: string;
    cultural_sensitivity: string;
    processing_status: string;
    processed_at: string;
    created_at: string;
    content_preview: {
      text: string;
      highlights: any[];
      total_length: number;
    };
    ai_analysis: any;
  };
  extraction: {
    summary: string;
    statistics: {
      total_themes: number;
      total_quotes: number;
      total_insights: number;
      average_confidence: number;
      high_confidence_count: number;
      categories_found: number;
      ai_models_used: string[];
      content_length: number;
    };
    themes_by_category: any;
    category_counts: any;
    all_themes: any[];
    quotes: any[];
    insights: any[];
    recommendations: string[];
  };
  navigation: {
    has_original_content: boolean;
    content_length: number;
    can_download_original: boolean;
    can_reprocess: boolean;
    verification_link: string;
    dashboard_link: string;
  };
}

export default function DocumentViewPage() {
  const params = useParams();
  const [documentReview, setDocumentReview] = useState<DocumentReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'quotes' | 'insights' | 'content'>('overview');

  useEffect(() => {
    if (params.id) {
      fetch(`/api/documents/review/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDocumentReview(data);
          } else {
            setError(data.error || 'Document not found');
          }
        })
        .catch(err => {
          setError('Failed to load document');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading document analysis...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error || !documentReview) {
    return (
      <PageLayout>
        <Container>
          <div className="bg-red-50 text-red-800 p-4 rounded mb-4">
            {error || 'Document not found'}
          </div>
          <Link href="/documents" className="text-blue-600 hover:underline">
            ← Back to documents
          </Link>
        </Container>
      </PageLayout>
    );
  }

  const { document, extraction, navigation } = documentReview;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoriesData = () => {
    if (!documentReview?.extraction?.category_counts) return [];
    return Object.entries(documentReview.extraction.category_counts || {}).map(([category, count]) => ({
      category,
      count,
      themes: documentReview.extraction.themes_by_category?.[category] || []
    }));
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <Container>
          <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Documents Library
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
              <p className="text-muted-foreground mb-4">{extraction.summary}</p>
              
              <div className="flex items-center gap-4 flex-wrap">
                {getStatusBadge(document.processing_status)}
                <Badge variant="outline">{document.file_type || 'Unknown Type'}</Badge>
                <Badge variant="outline">{document.cultural_sensitivity || 'Public'}</Badge>
                <span className="text-sm text-muted-foreground">
                  Processed: {new Date(document.processed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(navigation.verification_link, '_blank')}
              >
                Verify Quality
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(navigation.dashboard_link, '_blank')}
              >
                Dashboard
              </Button>
              {navigation.can_reprocess && (
                <Button variant="secondary" size="sm">
                  Reprocess
                </Button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Statistics Cards */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{extraction.statistics.total_themes}</p>
                  <p className="text-sm text-muted-foreground">Themes Extracted</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{extraction.statistics.total_quotes}</p>
                  <p className="text-sm text-muted-foreground">Community Quotes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{extraction.statistics.total_insights}</p>
                  <p className="text-sm text-muted-foreground">Key Insights</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.round((extraction.statistics.average_confidence || 0) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Confidence Score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Navigation Tabs */}
      <section className="py-4 border-b">
        <Container>
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'themes', label: `Themes (${extraction.statistics.total_themes})` },
              { id: 'quotes', label: `Quotes (${extraction.statistics.total_quotes})` },
              { id: 'insights', label: `Insights (${extraction.statistics.total_insights})` },
              { id: 'content', label: 'Content Preview' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Tab Content */}
      <section className="py-8">
        <Container>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Categories Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Categories</CardTitle>
                  <CardDescription>Distribution of themes by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCategoriesData().map(({ category, count }) => (
                      <div key={category} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Processing Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Details</CardTitle>
                  <CardDescription>AI analysis and quality metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">AI Models Used</h4>
                      <div className="space-y-1">
                        {(extraction?.statistics?.ai_models_used || []).map((model, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Quality Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>High Confidence Themes:</span>
                          <span>{extraction.statistics.high_confidence_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Categories Found:</span>
                          <span>{extraction.statistics.categories_found}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Content Length:</span>
                          <span>{Math.round(extraction.statistics.content_length / 1000)}K chars</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {extraction.recommendations && extraction.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Suggested actions for this document</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(extraction?.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-6">
              {getCategoriesData().map(({ category, count, themes }) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category.replace('_', ' ')} ({count})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(themes || []).map((theme: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{theme.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <Badge variant="outline">
                                {Math.round((theme.confidence || 0) * 100)}%
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{theme.ai_model}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'quotes' && (
            <Card>
              <CardHeader>
                <CardTitle>Community Quotes</CardTitle>
                <CardDescription>Extracted community voices and perspectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(extraction?.quotes || []).map((quote: any, index: number) => (
                    <div key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50">
                      <blockquote className="text-gray-800 mb-2">"{quote.text}"</blockquote>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {quote.speaker ? `— ${quote.speaker}` : '— Community Member'}
                        </span>
                        <Badge variant="outline">{quote.cultural_sensitivity || 'public'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'insights' && (
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Strategic insights about community needs and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(extraction?.insights || []).map((insight: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary">{insight.type}</Badge>
                            <Badge variant="outline">
                              {Math.round((insight.confidence || 0) * 100)}%
                            </Badge>
                          </div>
                          <p className="text-gray-800 mb-2">{insight.insight}</p>
                          {insight.evidence && (insight.evidence || []).length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Evidence:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {(insight.evidence || []).map((evidence: string, evidenceIndex: number) => (
                                  <li key={evidenceIndex}>• {evidence}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'content' && (
            <Card>
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
                <CardDescription>
                  Original document content with highlighted themes
                  ({document.content_preview?.total_length.toLocaleString()} characters total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans bg-gray-50 p-4 rounded-lg">
                    {document.content_preview?.text || 'No content preview available'}
                  </pre>
                </div>
                <div className="mt-4 text-center space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/api/documents/${params.id}/file`, '_blank')}
                  >
                    📄 View Original Document
                  </Button>
                  <Link href={`/documents/${params.id}/view`}>
                    <Button variant="ghost">
                      📄 View Extracted Text
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/documents/${params.id}/file?download=true`;
                      link.download = '';
                      link.click();
                    }}
                  >
                    💾 Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>
    </PageLayout>
  );
}