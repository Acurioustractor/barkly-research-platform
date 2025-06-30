'use client';

import React, { useState, useEffect } from 'react';
import { BulkUploader } from '@/components/admin/BulkUploader';
import { DatabaseStatus } from '@/components/core/DatabaseStatus';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import dynamic from 'next/dynamic';

const AIConfigPanel = dynamic(() => import('@/components/admin/AIConfigPanel'), {
  ssr: false,
  loading: () => <div className="p-4">Loading AI configuration...</div>
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'analytics' | 'ai'>('upload');
  const [stats, setStats] = useState<{ totalDocuments: number; totalChunks: number; totalThemes: number; totalQuotes: number } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/documents/metrics');
      if (response.ok) {
        const data = await response.json();
        setStats(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const ProcessingMetrics = dynamic(() => import('@/components/visualization/ProcessingMetrics'), {
    ssr: false,
    loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>
  });

  const tabs = [
    { id: 'upload', label: 'Bulk Upload', description: 'Upload multiple documents for processing' },
    { id: 'manage', label: 'Document Management', description: 'Search, organize, and manage documents' },
    { id: 'analytics', label: 'Analytics', description: 'View processing statistics and insights' },
    { id: 'ai', label: 'AI Config', description: 'Configure AI models and processing options' }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Document Administration
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Manage the document repository that powers the Barkly Research Platform. Upload documents in bulk, 
            organize collections, and monitor processing analytics.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'upload' | 'manage' | 'analytics' | 'ai')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Database Status */}
        <DatabaseStatus />

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Bulk Document Upload</h2>
                <p className="text-muted-foreground">
                  Upload multiple PDF documents simultaneously. Each document will be processed, chunked, 
                  and analyzed for themes, quotes, and insights.
                </p>
              </div>
              
              <BulkUploader 
                onUploadComplete={(results) => {
                  console.log('Upload completed:', results);
                }}
              />

              {/* Upload Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Guidelines</CardTitle>
                  <CardDescription>
                    Best practices for bulk document processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">File Requirements</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• PDF format only</li>
                        <li>• Maximum 50MB per file</li>
                        <li>• Up to 100 files per batch</li>
                        <li>• Text-based PDFs (not scanned images)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Processing Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Automatic text extraction</li>
                        <li>• Intelligent document chunking</li>
                        <li>• Theme identification</li>
                        <li>• Quote extraction with confidence scoring</li>
                        <li>• Keyword analysis and categorization</li>
                        <li>• Insight generation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Document Management</h2>
                <p className="text-muted-foreground">
                  Search, filter, and organize documents in the repository.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">Document Management Interface</h3>
                    <p className="text-muted-foreground mb-4">
                      Coming soon - Advanced search, filtering, and organization tools
                    </p>
                    <Button variant="secondary" disabled>
                      View Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Processing Analytics</h2>
                <p className="text-muted-foreground">
                  Monitor document processing statistics and insights.
                </p>
              </div>
              
              <ProcessingMetrics />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">AI Configuration</h2>
                <p className="text-muted-foreground">
                  Configure AI models, processing profiles, and cost settings.
                </p>
              </div>
              
              <AIConfigPanel />
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Repository Status</CardTitle>
            <CardDescription>Current state of the document repository</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totalDocuments || '-'}</div>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totalChunks || '-'}</div>
                <p className="text-xs text-muted-foreground">Processed Chunks</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totalThemes || '-'}</div>
                <p className="text-xs text-muted-foreground">Identified Themes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totalQuotes || '-'}</div>
                <p className="text-xs text-muted-foreground">Extracted Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>Available endpoints for document management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>POST /api/documents/bulk-upload</code>
                <span className="text-muted-foreground">Bulk document upload</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/search</code>
                <span className="text-muted-foreground">Search documents</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/[id]</code>
                <span className="text-muted-foreground">Get document details</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/[id]/chunks</code>
                <span className="text-muted-foreground">Get document chunks</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>POST /api/documents/collections</code>
                <span className="text-muted-foreground">Create collections</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>POST /api/documents/search/semantic</code>
                <span className="text-muted-foreground">Semantic search</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>POST /api/documents/async-upload</code>
                <span className="text-muted-foreground">Async bulk upload</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/ai/config</code>
                <span className="text-muted-foreground">AI configuration</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/insights</code>
                <span className="text-muted-foreground">Document insights</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/metrics</code>
                <span className="text-muted-foreground">Processing metrics</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <code>GET /api/documents/network</code>
                <span className="text-muted-foreground">Document network</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}