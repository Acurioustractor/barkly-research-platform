'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Button } from './Button';
import type { ExtractedContent } from '@/utils/document-processor';

export interface DocumentResultsProps {
  results: ExtractedContent | any;
  className?: string;
}

export const DocumentResults: React.FC<DocumentResultsProps> = ({
  results,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'quotes' | 'insights' | 'text'>('overview');

  // Handle both single document and multiple document results
  const isSingleDocument = 'text' in results;
  const singleDoc = isSingleDocument ? results as ExtractedContent : null;
  const multiDoc = !isSingleDocument ? results : null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'themes', label: 'Themes' },
    { id: 'quotes', label: 'Key Quotes' },
    { id: 'insights', label: 'Insights' },
    { id: 'text', label: 'Full Text' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {isSingleDocument && singleDoc ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{singleDoc.metadata.pageCount}</div>
                <p className="text-xs text-muted-foreground">Pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{singleDoc.metadata.wordCount?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Words</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{singleDoc.themes.length}</div>
                <p className="text-xs text-muted-foreground">Themes Identified</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{singleDoc.quotes.length}</div>
                <p className="text-xs text-muted-foreground">Key Quotes</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="font-medium mb-3">Document Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filename:</span>
                <span>{singleDoc.metadata.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size:</span>
                <span>{(singleDoc.metadata.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed:</span>
                <span>{new Date(singleDoc.metadata.uploadDate).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      ) : multiDoc ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{multiDoc.individual.length}</div>
                <p className="text-xs text-muted-foreground">Documents Processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{multiDoc.comparative.commonThemes.length}</div>
                <p className="text-xs text-muted-foreground">Common Themes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{Math.round(multiDoc.comparative.documentSimilarity * 100)}%</div>
                <p className="text-xs text-muted-foreground">Similarity Score</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="font-medium mb-3">Common Themes Across Documents</h4>
            <div className="flex flex-wrap gap-2">
              {multiDoc.comparative.commonThemes.map((theme: string) => (
                <span
                  key={theme}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Document Summary</h4>
            <div className="space-y-3">
              {multiDoc.individual.map((doc: ExtractedContent, index: number) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{doc.metadata.filename}</h5>
                    <span className="text-xs text-muted-foreground">
                      {doc.metadata.pageCount} pages
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{doc.themes.length} themes</span> • 
                    <span>{doc.quotes.length} quotes</span> • 
                    <span>{doc.keywords.length} keywords</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  const renderThemes = () => {
    const themes = isSingleDocument && singleDoc ? singleDoc.themes : 
                  multiDoc ? multiDoc.comparative.commonThemes : [];

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Identified themes based on content analysis and keyword patterns
        </p>
        {themes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {themes.map((theme: string) => (
              <Card key={theme}>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2">{theme}</h4>
                  <p className="text-sm text-muted-foreground">
                    This theme was identified through pattern matching and content analysis
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No themes identified in this document</p>
        )}
      </div>
    );
  };

  const renderQuotes = () => {
    const quotes = isSingleDocument && singleDoc ? singleDoc.quotes : 
                  multiDoc ? multiDoc.individual.flatMap((doc: ExtractedContent) => 
                    doc.quotes.map(quote => ({ ...quote, source: doc.metadata.filename }))
                  ) : [];

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Key quotes and statements extracted from the document(s)
        </p>
        {quotes.length > 0 ? (
          <div className="space-y-4">
            {quotes.map((quote: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <blockquote className="text-lg italic mb-3">
                    &ldquo;{quote.text}&rdquo;
                  </blockquote>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      {quote.context && (
                        <p className="text-muted-foreground">Context: {quote.context}</p>
                      )}
                      {quote.source && (
                        <p className="text-muted-foreground">Source: {quote.source}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {Math.round(quote.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No quotes extracted from this document</p>
        )}
      </div>
    );
  };

  const renderInsights = () => {
    const insights = isSingleDocument && singleDoc ? singleDoc.insights : 
                    multiDoc ? multiDoc.individual.flatMap((doc: ExtractedContent) => 
                      doc.insights.map(insight => ({ text: insight, source: doc.metadata.filename }))
                    ) : [];

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          AI-generated insights based on content analysis
        </p>
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        {typeof insight === 'string' ? insight : insight.text}
                      </p>
                      {insight.source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {insight.source}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No insights generated for this document</p>
        )}
      </div>
    );
  };

  const renderFullText = () => {
    const text = isSingleDocument && singleDoc ? singleDoc.text : '';

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Complete extracted text from the PDF document
        </p>
        {text ? (
          <div className="max-h-96 overflow-y-auto p-4 bg-muted/50 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {text}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Full text view is only available for single document analysis
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Document Analysis Results</CardTitle>
        <CardDescription>
          AI-powered analysis of your uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'themes' && renderThemes()}
          {activeTab === 'quotes' && renderQuotes()}
          {activeTab === 'insights' && renderInsights()}
          {activeTab === 'text' && renderFullText()}
        </div>
      </CardContent>
    </Card>
  );
};