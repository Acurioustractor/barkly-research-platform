/**
 * Entity Relationship Analysis Dashboard
 * Provides comprehensive analysis and insights for entity relationships
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/core/Card';

interface RelationshipAnalysisProps {
  documentId?: string;
  entityIds?: string[];
  refreshTrigger?: number;
}

interface RelationshipAnalysis {
  totalRelationships: number;
  relationshipTypes: Record<string, number>;
  strongestRelationships: any[];
  entityConnections: any[];
  networkMetrics: {
    density: number;
    averageStrength: number;
    strongConnectionsCount: number;
    weakConnectionsCount: number;
    isolatedEntities: number;
    mostConnectedEntity?: {
      id: string;
      name: string;
      connectionCount: number;
    };
  };
  clusters: any[];
  insights: any[];
  summary: {
    totalEntities: number;
    averageConnectionsPerEntity: number;
    strongRelationshipsCount: number;
    relationshipTypeDistribution: Record<string, number>;
    topConnectedEntities: any[];
  };
}

export function EntityRelationshipAnalysis({
  documentId,
  entityIds,
  refreshTrigger = 0
}: RelationshipAnalysisProps) {
  const [analysis, setAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'clusters' | 'insights'>('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!documentId && (!entityIds || entityIds.length === 0)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (documentId) params.append('documentId', documentId);
        if (entityIds && entityIds.length > 0) {
          entityIds.forEach(id => params.append('entityId', id));
        }
        params.append('includeAnalysis', 'true');

        const response = await fetch(`/api/entities/relationships?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch analysis: ${response.statusText}`);
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        console.error('Error fetching relationship analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [documentId, entityIds, refreshTrigger]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading analysis: {error}</p>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>No relationship data available</p>
        </div>
      </Card>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50">
          <div className="text-2xl font-bold text-blue-900">
            {analysis.totalRelationships}
          </div>
          <div className="text-sm text-blue-600">Total Relationships</div>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-900">
            {analysis.summary.totalEntities}
          </div>
          <div className="text-sm text-green-600">Connected Entities</div>
        </Card>
        <Card className="p-4 bg-purple-50">
          <div className="text-2xl font-bold text-purple-900">
            {analysis.summary.averageConnectionsPerEntity.toFixed(1)}
          </div>
          <div className="text-sm text-purple-600">Avg Connections</div>
        </Card>
        <Card className="p-4 bg-orange-50">
          <div className="text-2xl font-bold text-orange-900">
            {analysis.summary.strongRelationshipsCount}
          </div>
          <div className="text-sm text-orange-600">Strong Relationships</div>
        </Card>
      </div>

      {/* Relationship Types */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Relationship Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(analysis.relationshipTypes).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="capitalize">{type.replace('_', ' ')}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Connected Entities */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Most Connected Entities</h4>
        <div className="space-y-3">
          {analysis.summary.topConnectedEntities.slice(0, 5).map((entity: any, index: number) => (
            <div key={entity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-800">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{entity.name}</div>
                  <div className="text-sm text-gray-600">{entity.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{entity.connectionCount}</div>
                <div className="text-sm text-gray-600">connections</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strongest Relationships */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Strongest Relationships</h4>
        <div className="space-y-3">
          {analysis.strongestRelationships.slice(0, 5).map((rel: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rel.fromEntity.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{rel.toEntity.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${rel.strength * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{(rel.strength * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="capitalize">{rel.type}</span> • {rel.relationship}
              </div>
              {rel.description && (
                <div className="text-sm text-gray-500 mt-1">{rel.description}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderNetworkMetrics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network Density */}
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Network Density</h4>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analysis.networkMetrics.density * 351.86} 351.86`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {(analysis.networkMetrics.density * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            How connected the network is relative to a fully connected network
          </p>
        </Card>

        {/* Average Strength */}
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Average Relationship Strength</h4>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analysis.networkMetrics.averageStrength * 351.86} 351.86`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {analysis.networkMetrics.averageStrength.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            Average strength of all relationships (0-1 scale)
          </p>
        </Card>
      </div>

      {/* Connection Strength Distribution */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Connection Strength Distribution</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {analysis.networkMetrics.strongConnectionsCount}
            </div>
            <div className="text-sm text-green-600">Strong (≥0.7)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-900">
              {analysis.totalRelationships - analysis.networkMetrics.strongConnectionsCount - analysis.networkMetrics.weakConnectionsCount}
            </div>
            <div className="text-sm text-yellow-600">Medium (0.3-0.7)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-900">
              {analysis.networkMetrics.weakConnectionsCount}
            </div>
            <div className="text-sm text-red-600">Weak (&lt;0.3)</div>
          </div>
        </div>
      </Card>

      {/* Most Connected Entity */}
      {analysis.networkMetrics.mostConnectedEntity && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Network Hub</h4>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">
                  {analysis.networkMetrics.mostConnectedEntity.name}
                </div>
                <div className="text-sm text-blue-600">Most connected entity</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {analysis.networkMetrics.mostConnectedEntity.connectionCount}
                </div>
                <div className="text-sm text-blue-600">connections</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderClusters = () => (
    <div className="space-y-4">
      {analysis.clusters.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">
          <p>No entity clusters detected</p>
        </Card>
      ) : (
        analysis.clusters.map((cluster, index) => (
          <Card key={cluster.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Cluster {index + 1}</h4>
              <div className="text-sm text-gray-600">
                {cluster.size} entities
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">Central Entity</div>
                <div className="font-medium">{cluster.centralEntity}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600">Avg Strength</div>
                <div className="font-medium">{cluster.averageStrength.toFixed(2)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-purple-600">Dominant Type</div>
                <div className="font-medium capitalize">{cluster.dominantRelationshipType}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Entities in cluster:</div>
              <div className="flex flex-wrap gap-2">
                {cluster.entityNames.map((name: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-4">
      {analysis.insights.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">
          <p>No insights available</p>
        </Card>
      ) : (
        analysis.insights.map((insight: any, index: number) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                insight.type === 'strength' ? 'bg-green-100 text-green-800' :
                insight.type === 'pattern' ? 'bg-blue-100 text-blue-800' :
                insight.type === 'opportunity' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {insight.type === 'strength' ? '💪' :
                 insight.type === 'pattern' ? '🔍' :
                 insight.type === 'opportunity' ? '💡' : '⚠️'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    insight.type === 'strength' ? 'bg-green-100 text-green-800' :
                    insight.type === 'pattern' ? 'bg-blue-100 text-blue-800' :
                    insight.type === 'opportunity' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {insight.type}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{insight.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                  {insight.actionable && (
                    <span className="text-green-600">✓ Actionable</span>
                  )}
                </div>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {insight.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Relationship Analysis</h3>
          <div className="text-sm text-gray-600">
            {analysis.totalRelationships} relationships analyzed
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'network', label: 'Network Metrics' },
              { id: 'clusters', label: 'Clusters' },
              { id: 'insights', label: 'Insights' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'network' && renderNetworkMetrics()}
          {activeTab === 'clusters' && renderClusters()}
          {activeTab === 'insights' && renderInsights()}
        </div>
      </div>
    </Card>
  );
} 