"use client";

import React from 'react';
import { Container } from '@/components/core/Container';
import { EntitySearch, EntityAnalyticsDashboard } from '@/components/entities';

export default function EntitiesPage() {
  return (
    <Container className="py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Entity Intelligence</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore and analyze entities extracted from your documents. 
            Search for specific entities, discover patterns, and gain insights 
            from your document collection.
          </p>
        </div>

        {/* Entity Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Entity Search</h2>
            <p className="text-gray-600 mt-1">
              Search for entities across all documents with advanced filtering options.
            </p>
          </div>
          <div className="p-6">
            <EntitySearch 
              onEntitySelect={(entity) => {
                console.log('Selected entity:', entity);
                // Handle entity selection - could open a modal, navigate to details, etc.
              }}
            />
          </div>
        </div>

        {/* Entity Analytics Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Entity Analytics</h2>
            <p className="text-gray-600 mt-1">
              Comprehensive analytics and insights about entities in your document collection.
            </p>
          </div>
          <div className="p-6">
            <EntityAnalyticsDashboard />
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Smart Search</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Advanced entity search with fuzzy matching, semantic search, and intelligent filtering.
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Pattern Detection</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Automatically discover co-occurrence patterns, frequency distributions, and contextual relationships.
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">AI Insights</h3>
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered insights and recommendations to improve entity extraction and analysis.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">High Performance</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Optimized for large document collections with efficient indexing and caching.
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Real-time Updates</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Entities are extracted and updated in real-time as new documents are processed.
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Batch Processing</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Process multiple documents simultaneously with comparative analysis capabilities.
            </p>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="ml-2 text-sm text-gray-800">/api/entities</code>
              </div>
              <p className="text-sm text-gray-600">List and filter entities with pagination support</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="ml-2 text-sm text-gray-800">/api/entities/search</code>
              </div>
              <p className="text-sm text-gray-600">Advanced entity search with multiple modes</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="ml-2 text-sm text-gray-800">/api/entities/analytics</code>
              </div>
              <p className="text-sm text-gray-600">Entity analytics and statistics</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="ml-2 text-sm text-gray-800">/api/entities/insights</code>
              </div>
              <p className="text-sm text-gray-600">AI-powered insights and recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
} 