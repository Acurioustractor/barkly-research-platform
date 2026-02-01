'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core/Badge';
import Link from 'next/link';

interface DocumentView {
  document: {
    id: string;
    title: string;
    file_type: string;
    cultural_sensitivity: string;
    created_at: string;
    processed_at: string;
    content_preview: {
      text: string;
      total_length: number;
      highlights?: any[];
    };
  };
  extraction: {
    summary: string;
    statistics: {
      total_themes: number;
      total_quotes: number;
      total_insights: number;
      content_length: number;
    };
  };
}

export default function DocumentViewPage() {
  const params = useParams();
  const [documentView, setDocumentView] = useState<DocumentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/review/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocumentView({
            document: data.document,
            extraction: data.extraction
          });
        } else {
          setError(data.error || 'Document not found');
        }
      } else {
        setError('Failed to load document');
      }
    } catch (error) {
      console.error('Document fetch error:', error);
      setError('Document temporarily unavailable');
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
              <p>Loading document...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error || !documentView) {
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

  const { document: doc, extraction } = documentView;

  // Format the text content with basic styling
  const formatContent = (text: string) => {
    return text
      .split('\n\n')
      .map((paragraph, index) => {
        if (!paragraph.trim()) return null;

        // Check if it's a heading (all caps or ends with colon)
        if (paragraph.trim().length < 100 &&
          (paragraph === paragraph.toUpperCase() || paragraph.trim().endsWith(':'))) {
          return (
            <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-800">
              {paragraph.trim()}
            </h3>
          );
        }

        return (
          <p key={index} className="mb-4 leading-relaxed text-gray-700">
            {paragraph.trim()}
          </p>
        );
      })
      .filter(Boolean);
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <Container>
          <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Documents
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{doc.title}</h1>

              <div className="flex items-center gap-4 flex-wrap mb-4">
                <Badge variant="outline">
                  {doc.file_type === 'application/pdf' ? 'PDF Document' :
                    doc.file_type === 'text/x-markdown' ? 'Markdown' :
                      doc.file_type || 'Document'}
                </Badge>
                <Badge variant={
                  doc.cultural_sensitivity === 'public' ? 'success' :
                    doc.cultural_sensitivity === 'community' ? 'secondary' : 'destructive'
                }>
                  {doc.cultural_sensitivity || 'Public'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Math.round(doc.content_preview.total_length / 1000)}K characters
                </span>
              </div>

              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">ℹ️</div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Document Content Extract
                    </p>
                    <p className="text-sm text-blue-700">
                      This shows the text content extracted from the original {doc.file_type === 'application/pdf' ? 'PDF' : 'document'}
                      for AI analysis. Formatting, images, and layout from the original file are not preserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/documents/${params.id}/download`, '_blank')}
              >
                💾 Download Text
              </Button>
              <Link href={`/documents/${params.id}`}>
                <Button variant="secondary" size="sm">
                  📊 View Analysis
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Document Content */}
      <section className="py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Document Content</CardTitle>
                <CardDescription>
                  Extracted text content ({doc.content_preview.total_length.toLocaleString()} characters) •
                  {extraction.statistics.total_themes} themes •
                  {extraction.statistics.total_quotes} quotes identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="bg-white border rounded-lg p-8">
                    {formatContent(doc.content_preview.text)}

                    {doc.content_preview.text.endsWith('...') && (
                      <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-muted-foreground text-sm mb-4">
                          Content preview truncated. Full text available for AI analysis.
                        </p>
                        <Link href={`/documents/${params.id}`}>
                          <Button variant="outline">
                            View Complete AI Analysis
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-muted/30">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{extraction.statistics.total_themes}</div>
                  <div className="text-xs text-muted-foreground">Themes Identified</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{extraction.statistics.total_quotes}</div>
                  <div className="text-xs text-muted-foreground">Community Quotes</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{extraction.statistics.total_insights}</div>
                  <div className="text-xs text-muted-foreground">Key Insights</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(extraction.statistics.content_length / 1000)}K
                  </div>
                  <div className="text-xs text-muted-foreground">Characters</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}