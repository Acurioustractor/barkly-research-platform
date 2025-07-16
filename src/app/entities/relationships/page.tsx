/**
 * Entity Relationships Page
 * Comprehensive interface for exploring and analyzing entity relationships
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/core/Card';
import { EntityRelationshipGraph, EntityRelationshipAnalysis } from '@/components/entities';

export default function EntityRelationshipsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents?limit=50');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setDocuments(data.data);
          setSelectedDocument(data.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entity Relationships</h1>
            <p className="text-gray-600 mt-2">
              Explore and analyze relationships between entities across your documents
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Analysis
          </button>
        </div>

        {/* Document Selector */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Select Document:</label>
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a document...</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.filename || 'Untitled Document'}
                </option>
              ))}
            </select>
            {selectedDocument && (
              <div className="text-sm text-gray-600">
                Document selected: {documents.find(d => d.id === selectedDocument)?.title || 'Untitled'}
              </div>
            )}
          </div>
        </Card>

        {selectedDocument ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Relationship Graph */}
            <div className="xl:col-span-2">
              <EntityRelationshipGraph
                documentId={selectedDocument}
                height={500}
                showControls={true}
                onNodeClick={(node) => {
                  console.log('Node clicked:', node);
                }}
                onEdgeClick={(edge) => {
                  console.log('Edge clicked:', edge);
                }}
              />
            </div>

            {/* Relationship Analysis */}
            <div className="xl:col-span-2">
              <EntityRelationshipAnalysis
                documentId={selectedDocument}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a Document to View Relationships
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Choose a document from the dropdown above to explore entity relationships, 
                view network graphs, and analyze connection patterns.
              </p>
              
              {documents.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    No documents found. Upload and process some documents first to see entity relationships.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Network Analysis</h3>
              <p className="text-sm text-gray-600">
                Analyze network density, connection strength, and identify the most connected entities
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-800 mb-2">Entity Clusters</h3>
              <p className="text-sm text-gray-600">
                Discover groups of strongly connected entities and understand their relationships
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">💡</div>
              <h3 className="font-semibold text-gray-800 mb-2">Smart Insights</h3>
              <p className="text-sm text-gray-600">
                Get AI-powered insights about relationship patterns and potential opportunities
              </p>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">How to Use Entity Relationships</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Interactive Graph</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click on nodes to select entities and see details</li>
                <li>• Use controls to filter by relationship strength and type</li>
                <li>• Node size indicates connection count</li>
                <li>• Edge thickness shows relationship strength</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Analysis Dashboard</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Overview tab shows summary statistics</li>
                <li>• Network tab provides detailed network metrics</li>
                <li>• Clusters tab reveals entity groupings</li>
                <li>• Insights tab offers AI-powered recommendations</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 