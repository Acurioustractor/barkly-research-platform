'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core/Badge';
import Link from 'next/link';

interface DocumentAnalysis {
  document: {
    id: string;
    title: string;
    file_type: string;
    processing_status: string;
    processed_at: string;
  };
  themes: any[];
  quotes: any[];
  insights: any[];
  statistics: {
    total_themes: number;
    total_quotes: number;
    total_insights: number;
    average_confidence: number;
    ai_models_used: string[];
  };
}

export default function DocumentAnalysisPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  const fetchAnalysis = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/documents/verify-extraction?documentId=${params.id}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis({
            document: data.document,
            themes: data.themes || [],
            quotes: data.quotes || [],
            insights: data.insights || [],
            statistics: data.statistics || {
              total_themes: 0,
              total_quotes: 0,
              total_insights: 0,
              average_confidence: 0,
              ai_models_used: []
            }
          });
        } else {
          setError(data.error || 'Analysis not available');
        }
      } else {
        setError('Failed to load analysis');
      }
    } catch (error) {
      console.error('Analysis fetch error:', error);
      setError('Analysis temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading AI analysis...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error || !analysis) {
    return (
      <PageLayout>
        <Container>
          <div className="bg-red-50 text-red-800 p-4 rounded mb-4">
            {error || 'Analysis not found'}
          </div>
          <Link href="/documents" className="text-blue-600 hover:underline">
            ← Back to documents
          </Link>
        </Container>
      </PageLayout>
    );
  }

  const { document, themes, quotes, insights, statistics } = analysis;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-purple-50 to-blue-50">
        <Container>
          <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Documents
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">AI Analysis</h1>
          <h2 className="text-xl text-muted-foreground mb-4">{document.title}</h2>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">{document.file_type || 'Document'}</Badge>
            <Badge variant={document.processing_status === 'completed' ? 'success' : 'secondary'}>
              {document.processing_status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Processed: {new Date(document.processed_at).toLocaleDateString()}
            </span>
          </div>
        </Container>
      </section>

      {/* Statistics */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{statistics.total_themes}</p>
                <p className="text-sm text-muted-foreground">Themes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{statistics.total_quotes}</p>
                <p className="text-sm text-muted-foreground">Quotes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-purple-600">{statistics.total_insights}</p>
                <p className="text-sm text-muted-foreground">Insights</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(statistics.average_confidence * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">Confidence</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* AI Models Used */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>AI Processing Details</CardTitle>
              <CardDescription>Models and methods used for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(statistics.ai_models_used || []).map((model, index) => (
                  <Badge key={index} variant="outline">{model}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Themes */}
      {themes.length > 0 && (
        <section className="py-8">
          <Container>
            <Card>
              <CardHeader>
                <CardTitle>Extracted Themes ({themes.length})</CardTitle>
                <CardDescription>Key themes and services identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(themes || []).slice(0, 10).map((theme: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{theme.theme_name || theme.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {theme.description || 'Theme extracted from document'}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {Math.round((theme.confidence_score || theme.confidence || 0.8) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {themes.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href={`/documents/${params.id}`}>
                        <Button variant="outline">View All {themes.length} Themes</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>
      )}

      {/* Quotes */}
      {quotes.length > 0 && (
        <section className="py-8 bg-muted/30">
          <Container>
            <Card>
              <CardHeader>
                <CardTitle>Community Quotes ({quotes.length})</CardTitle>
                <CardDescription>Extracted community voices and perspectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(quotes || []).slice(0, 5).map((quote: any, index: number) => (
                    <div key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50">
                      <blockquote className="text-gray-800 mb-2">
                        "{quote.quote_text || quote.text}"
                      </blockquote>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {quote.knowledge_holder || quote.speaker || '— Community Member'}
                        </span>
                        <Badge variant="outline">
                          {quote.cultural_sensitivity || 'public'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {quotes.length > 5 && (
                    <div className="text-center pt-4">
                      <Link href={`/documents/${params.id}`}>
                        <Button variant="outline">View All {quotes.length} Quotes</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section className="py-8">
          <Container>
            <Card>
              <CardHeader>
                <CardTitle>Key Insights ({insights.length})</CardTitle>
                <CardDescription>Strategic insights about community needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(insights || []).slice(0, 5).map((insight: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary">{insight.type || 'community_need'}</Badge>
                        <Badge variant="outline">
                          {Math.round((insight.confidence || 0.8) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-gray-800">{insight.insight}</p>
                    </div>
                  ))}
                  {insights.length > 5 && (
                    <div className="text-center pt-4">
                      <Link href={`/documents/${params.id}`}>
                        <Button variant="outline">View All {insights.length} Insights</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>
      )}

      {/* Actions */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Document Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href={`/documents/${params.id}`}>
                  <Button variant="primary">View Full Document</Button>
                </Link>
                <Link href={`/documents/${params.id}/preview`}>
                  <Button variant="outline">Document Preview</Button>
                </Link>
                <Link href="/documents">
                  <Button variant="ghost">Back to Library</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}