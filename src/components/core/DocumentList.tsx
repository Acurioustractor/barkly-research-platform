'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Link from 'next/link';

interface Document {
  id: string;
  originalName: string;
  status: string;
  uploadedAt: string;
  size: number;
  fullText: string | null;
  pageCount: number | null;
  wordCount: number | null;
}

export const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/check-db')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.recentDocuments) {
          setDocuments(data.recentDocuments);
        } else {
          setError(data.error || 'Failed to load documents');
        }
      })
      .catch(err => {
        setError('Failed to fetch documents');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-muted-foreground">No documents uploaded yet</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/documents/${doc.id}`} className="hover:underline">
                      <h3 className="font-medium text-blue-600">{doc.originalName}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Size: {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                  {doc.pageCount && <p>Pages: {doc.pageCount}</p>}
                  {doc.wordCount && <p>Words: {doc.wordCount}</p>}
                  {doc.fullText && (
                    <p className="mt-2 italic truncate">{doc.fullText}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};