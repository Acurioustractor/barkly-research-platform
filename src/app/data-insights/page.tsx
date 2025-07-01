'use client';

import { PageLayout, Container } from '@/components/core';
import { DocumentUpload } from '@/components/core/DocumentUpload';
import { DocumentResults } from '@/components/core/DocumentResults';
import { DatabaseStatus } from '@/components/core/DatabaseStatus';
import { useState, useEffect } from 'react';

export default function DataInsightsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [latestDocument, setLatestDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestDocument();
  }, [refreshKey]);

  const fetchLatestDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents/search?limit=1&sortBy=uploadedAt&order=desc');
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const doc = data.results[0];
        
        // Fetch the full document details including text
        const fullDocResponse = await fetch(`/api/documents/${doc.id}`);
        if (fullDocResponse.ok) {
          const fullDocData = await fullDocResponse.json();
          const fullDoc = fullDocData.document || fullDocData;
          
          setLatestDocument({
            text: fullDoc.fullText || fullDoc.text || "Document text not available",
            themes: Array.isArray(fullDoc.themes) 
              ? fullDoc.themes.map((t: any) => typeof t === 'string' ? t : t.theme)
              : doc.themes || [],
            quotes: Array.isArray(fullDoc.quotes) 
              ? fullDoc.quotes.map((q: any) => typeof q === 'string' ? q : q.text || q.quote)
              : [],
            insights: Array.isArray(fullDoc.insights) 
              ? fullDoc.insights.map((i: any) => typeof i === 'string' ? i : i.insight || i.text)
              : [],
            keywords: Array.isArray(fullDoc.keywords) 
              ? fullDoc.keywords.map((k: any) => typeof k === 'string' ? k : k.keyword)
              : [],
            metadata: {
              pageCount: fullDoc.pageCount || doc.pageCount || 0,
              wordCount: fullDoc.wordCount || doc.wordCount || 0,
              processingTime: 0,
              filename: fullDoc.filename || fullDoc.originalName || doc.filename,
              size: fullDoc.size || 0,
              uploadedAt: fullDoc.uploadedAt || doc.uploadedAt
            }
          });
        } else {
          // Fallback to basic info if full document fetch fails
          setLatestDocument({
            text: doc.summary || "Document text not available",
            themes: doc.themes || [],
            quotes: [],
            insights: [],
            keywords: [],
            metadata: {
              pageCount: doc.pageCount || 0,
              wordCount: doc.wordCount || 0,
              processingTime: 0,
              filename: doc.filename || doc.originalName,
              size: 0,
              uploadedAt: doc.uploadedAt
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    // Refresh the document results when upload completes
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          {/* Page Header */}
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Data Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload and analyze community documents to extract insights and patterns
            </p>
          </div>

          {/* Database Status */}
          <div className="mb-8">
            <DatabaseStatus />
          </div>

          {/* Document Upload Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Upload Documents</h2>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Document Analysis Results */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Document Analysis</h2>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading documents...</div>
              </div>
            ) : latestDocument ? (
              <DocumentResults 
                key={refreshKey} 
                results={latestDocument}
              />
            ) : (
              <DocumentResults 
                key={refreshKey} 
                results={{
                  text: "No documents found. Upload documents to see analysis results here.",
                  themes: [],
                  quotes: [],
                  insights: [],
                  keywords: [],
                  metadata: {
                    pageCount: 0,
                    wordCount: 0,
                    processingTime: 0
                  }
                }}
              />
            )}
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}