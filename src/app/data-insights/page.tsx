'use client';

import { PageLayout, Container } from '@/components/core';
import { DocumentUpload } from '@/components/core/DocumentUpload';
import { DocumentResults } from '@/components/core/DocumentResults';
import { DatabaseStatus } from '@/components/core/DatabaseStatus';
import { useState } from 'react';

export default function DataInsightsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

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
            <DocumentResults 
              key={refreshKey} 
              results={{
                text: "Upload documents to see analysis results here",
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
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}