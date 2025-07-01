'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { DocumentUpload } from '@/components/core/DocumentUpload';
import { DocumentResults } from '@/components/core/DocumentResults';
import { DatabaseStatus } from '@/components/core/DatabaseStatus';
import { DocumentList } from '@/components/core/DocumentList';
import type { ExtractedContent } from '@/utils/document-processor';

export default function DocumentsPage() {
  const [uploadResults, setUploadResults] = useState<ExtractedContent | any | null>(null);

  const handleUploadComplete = (results: ExtractedContent | any) => {
    setUploadResults(results);
  };

  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          {/* Page Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Document Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload PDF documents to extract insights, themes, and youth voices using AI-powered analysis. 
              This tool helps identify key patterns and quotes from community research documents.
            </p>
          </div>

        {/* Database Status */}
        <DatabaseStatus />

        {/* Document List */}
        <DocumentList />

        {/* Upload Section */}
        <DocumentUpload 
          onUploadComplete={handleUploadComplete}
          maxFiles={5}
          className="w-full"
        />

        {/* Results Section */}
        {uploadResults && (
          <DocumentResults 
            results={uploadResults}
            className="w-full"
          />
        )}

        {/* Help Section */}
        {!uploadResults && (
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">How it works</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h4 className="font-medium">Upload PDFs</h4>
                <p className="text-sm text-muted-foreground">
                  Upload up to 5 PDF documents (max 10MB each) for analysis
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="font-medium">AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Extract themes, quotes, and insights focused on youth voices and community research
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-medium">View Results</h4>
                <p className="text-sm text-muted-foreground">
                  Browse extracted themes, quotes, insights, and comparative analysis
                </p>
              </div>
            </div>
          </div>
        )}
        </Container>
      </section>
    </PageLayout>
  );
}