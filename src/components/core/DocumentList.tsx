'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { StatusBadge, LoadingSpinner, ErrorMessage, HelpTooltip } from './';
import { Trash2, Edit3, Eye, Download } from 'lucide-react';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: editName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, originalName: editName.trim() } : doc
      ));
      setEditingId(null);
      setEditName('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rename document');
    }
  };

  const startEditing = (doc: Document) => {
    setEditingId(doc.id);
    setEditName(doc.originalName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSpinner message="Loading documents..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorMessage 
            message={error} 
            action={{ label: "Retry", onClick: () => window.location.reload() }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Document Library</CardTitle>
          <HelpTooltip content="Manage your uploaded documents - view, rename, delete, or download analysis results" />
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload PDF documents above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {editingId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(doc.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="primary" onClick={() => handleRename(doc.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium text-foreground truncate">{doc.originalName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <StatusBadge status={doc.status as any} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>Size: {formatFileSize(doc.size)}</span>
                      {doc.pageCount && <span>Pages: {doc.pageCount}</span>}
                      {doc.wordCount && <span>Words: {doc.wordCount.toLocaleString()}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => startEditing(doc)}
                      disabled={editingId === doc.id}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      loading={deletingId === doc.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {doc.fullText && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                    <p className="italic truncate">{doc.fullText.substring(0, 200)}...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};