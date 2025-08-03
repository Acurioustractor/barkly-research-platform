'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core/Badge';
import Link from 'next/link';

interface DocumentPreview {
  document: {
    id: string;
    title: string;
    file_type: string;
    cultural_sensitivity: string;
    created_at: string;
    content: string;
    ai_analysis?: any;
  };
  content_preview: {
    text: string;
    total_length: number;
  };
}

export default function DocumentPreviewPage() {
  const params = useParams();
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPreview();
    }
  }, [params.id]);

  const fetchPreview = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/documents/review/${params.id}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreview({
            document: data.document,
            content_preview: data.document.content_preview || {
              text: data.document.content?.substring(0, 2000) || 'No content preview available',
              total_length: data.document.content?.length || 0
            }
          });
        } else {
          setError(data.error || 'Preview not available');
        }
      } else {
        setError('Failed to load document preview');
      }
    } catch (error) {
      console.error('Preview fetch error:', error);
      setError('Preview temporarily unavailable');
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
              <p>Loading document preview...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error || !preview) {
    return (
      <PageLayout>
        <Container>
          <div className="bg-red-50 text-red-800 p-4 rounded mb-4">
            {error || 'Document preview not found'}
          </div>
          <Link href="/documents" className="text-blue-600 hover:underline">
            ← Back to documents
          </Link>
        </Container>
      </PageLayout>
    );
  }

  const { document, content_preview } = preview;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-indigo-50 to-purple-50">
        <Container>
          <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Documents
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Document Preview</h1>
          <h2 className="text-xl text-muted-foreground mb-4">{document.title}</h2>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">{document.file_type || 'Document'}</Badge>
            <Badge variant={
              document.cultural_sensitivity === 'public' ? 'success' :
              document.cultural_sensitivity === 'community' ? 'secondary' : 'destructive'
            }>
              {document.cultural_sensitivity || 'Public'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(content_preview.total_length / 1000)}K characters
            </span>
          </div>
        </Container>
      </section>

      {/* Content Preview */}
      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
              <CardDescription>
                Preview of document content ({content_preview.total_length.toLocaleString()} characters total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {content_preview.text}
                  </pre>
                  {content_preview.text.length < content_preview.total_length && (
                    <div className="mt-4 pt-4 border-t text-center">
                      <p className="text-muted-foreground text-sm mb-4">
                        Showing preview ({content_preview.text.length.toLocaleString()} of {content_preview.total_length.toLocaleString()} characters)
                      </p>
                      <Link href={`/documents/${params.id}`}>
                        <Button variant="outline">View Full Content</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Document Thumbnail */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Document Thumbnail</CardTitle>
              <CardDescription>Visual representation of the document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-32 bg-gray-100 border border-gray-300 rounded shadow-sm mx-auto mb-4 flex items-center justify-center">
                    <div className="text-gray-500">
                      {document.file_type === 'pdf' ? '📄' : 
                       document.file_type === 'docx' ? '📝' : 
                       document.file_type === 'md' ? '📝' : '📄'}
                    </div>
                  </div>
                  <h3 className="font-medium text-sm mb-2">{document.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {document.file_type?.toUpperCase() || 'Document'} • 
                    {Math.round(content_preview.total_length / 1000)}K chars
                  </p>
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Uploaded: {new Date(document.created_at).toLocaleDateString()}</p>
                    <p>Cultural Sensitivity: {document.cultural_sensitivity || 'Public'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Actions */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Full Document</CardTitle>
                <CardDescription>View complete document with analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/documents/${params.id}`}>
                  <Button className="w-full">View Full Document</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>See extracted themes and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/documents/${params.id}/analysis`}>
                  <Button className="w-full" variant="outline">View Analysis</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>Browse all community documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/documents">
                  <Button className="w-full" variant="ghost">Back to Library</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}