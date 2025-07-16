'use client';

import { useEffect, useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/core/Card';

interface StatusCheck {
  database: boolean;
  ai: boolean;
  aiProvider?: string;
  documents: number;
  error?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check database
      const dbResponse = await fetch('/api/check-db');
      const dbData = await dbResponse.json();
      
      // Check AI config
      const aiResponse = await fetch('/api/ai/config');
      const aiData = await aiResponse.json();
      
      // Count documents
      const countResponse = await fetch('/api/documents/count');
      const countData = await countResponse.json();
      
      setStatus({
        database: dbData.connected || false,
        ai: aiData.configured || false,
        aiProvider: aiData.provider,
        documents: countData.count || 0
      });
    } catch (error) {
      setStatus({
        database: false,
        ai: false,
        documents: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <section className="py-12">
        <Container>
          <h1 className="text-4xl font-bold mb-8">System Status</h1>
          
          {loading ? (
            <p>Checking status...</p>
          ) : status ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={status.database ? 'text-green-600' : 'text-red-600'}>
                    {status.database ? '✅ Connected' : '❌ Not Connected'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={status.ai ? 'text-green-600' : 'text-red-600'}>
                    {status.ai ? `✅ Configured (${status.aiProvider})` : '❌ Not Configured'}
                  </p>
                  {!status.ai && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{status.documents}</p>
                  <p className="text-sm text-muted-foreground">Total uploaded</p>
                </CardContent>
              </Card>
              
              {status.error && (
                <Card className="md:col-span-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">{status.error}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p>Unable to check status</p>
          )}
          
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <a href="/admin" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                Upload Documents
              </a>
              <a href="/documents" className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">
                View Documents
              </a>
              <a href="/insights" className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">
                View Insights
              </a>
              <a href="/systems" className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">
                Systems Map
              </a>
            </div>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}