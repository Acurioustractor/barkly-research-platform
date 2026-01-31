'use client';

import React, { useState, useEffect } from 'react';
import { getDocumentThumbnail } from '@/utils/thumbnails';

interface Document {
  id: string;
  title: string;
  thumbnailPath?: string;
}

export default function TestThumbnailsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents/overview');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🖼️ Thumbnail Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Document Thumbnail Info</h2>
        <div className="space-y-4">
          {documents.map((doc) => {
            const thumbnailPath = getDocumentThumbnail(doc);
            return (
              <div key={doc.id} className="border p-4 rounded">
                <div className="mb-2">
                  <strong>Title:</strong> {doc.title}
                </div>
                <div className="mb-2">
                  <strong>ID:</strong> {doc.id}
                </div>
                <div className="mb-2">
                  <strong>Database Thumbnail:</strong> {doc.thumbnailPath || 'None'}
                </div>
                <div className="mb-2">
                  <strong>Computed Thumbnail:</strong> {thumbnailPath || 'None'}
                </div>
                {thumbnailPath && (
                  <div className="mb-2">
                    <strong>Direct Link Test:</strong>{' '}
                    <a 
                      href={thumbnailPath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {thumbnailPath}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Visual Thumbnail Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const thumbnailPath = getDocumentThumbnail(doc);
            return (
              <div key={doc.id} className="border rounded p-4">
                <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                  {thumbnailPath ? (
                    <img 
                      src={thumbnailPath}
                      alt={`${doc.title} preview`}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log(`✅ Loaded: ${doc.title} from ${thumbnailPath}`);
                      }}
                      onError={(e) => {
                        console.error(`❌ Failed: ${doc.title} from ${thumbnailPath}`);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-red-500 text-sm p-2">❌ Failed to load</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="text-gray-500 text-sm p-2 text-center">
                      No thumbnail available
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium line-clamp-2">
                  {doc.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}