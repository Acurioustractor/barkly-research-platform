'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Document {
  id: string;
  filename: string;
  status: string;
  uploadedAt: string;
  fullText: string | null;
  pageCount: number | null;
  wordCount: number | null;
  themes: any[];
  quotes: any[];
  insights: any[];
}

export default function DocumentViewPage() {
  const params = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/documents/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.document) {
            setDocument(data.document);
          } else {
            setError(data.error || 'Document not found');
          }
        })
        .catch(err => {
          setError('Failed to load document');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">Loading document...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-800 p-4 rounded">
          {error || 'Document not found'}
        </div>
        <Link href="/documents" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to documents
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">{document.filename}</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`font-medium ${
              document.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'
            }`}>
              {document.status}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Themes</p>
            <p className="font-medium">{document.themes?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pages</p>
            <p className="font-medium">{document.pageCount || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Words</p>
            <p className="font-medium">{document.wordCount || 'Unknown'}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Uploaded</p>
          <p className="font-medium">{new Date(document.uploadedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Extracted Text</h2>
        {document.fullText ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {document.fullText}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500">No text extracted from this document.</p>
        )}
      </div>
    </div>
  );
}