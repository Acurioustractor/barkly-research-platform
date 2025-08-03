'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

interface NetworkNode {
  id: string;
  title: string;
  community: string;
  culturalSensitivity: string;
  themes: string[];
  connections: string[];
}

interface NetworkData {
  nodes: NetworkNode[];
  connections: Array<{
    source: string;
    target: string;
    strength: number;
    reason: string;
  }>;
}

export default function DocumentNetwork() {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await fetch('/api/documents/list');
      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || [];

        // Transform documents into network nodes
        const nodes: NetworkNode[] = documents.map((doc: any) => ({
          id: doc.id,
          title: doc.title || doc.filename,
          community: doc.community || 'General',
          culturalSensitivity: doc.cultural_sensitivity || 'Low',
          themes: doc.themes || [], // This would come from AI analysis
          connections: []
        }));

        // Generate mock connections based on community and themes
        const connections = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            
            let strength = 0;
            let reasons = [];

            // Same community connection
            if (nodeA.community === nodeB.community) {
              strength += 0.3;
              reasons.push('Same community');
            }

            // Similar cultural sensitivity
            if (nodeA.culturalSensitivity === nodeB.culturalSensitivity) {
              strength += 0.2;
              reasons.push('Similar cultural sensitivity');
            }

            // Mock theme overlap
            if (Math.random() > 0.7) {
              strength += 0.4;
              reasons.push('Shared themes');
            }

            if (strength > 0.3) {
              connections.push({
                source: nodeA.id,
                target: nodeB.id,
                strength,
                reason: reasons.join(', ')
              });
            }
          }
        }

        setNetworkData({ nodes, connections });
      }
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load network data</p>
        <Button onClick={fetchNetworkData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const getCommunityColor = (community: string) => {
    const colors = {
      'Tennant Creek': '#3B82F6',
      'Ali Curung': '#10B981',
      'Borroloola': '#F59E0B',
      'Elliott': '#EF4444',
      'General': '#6B7280'
    };
    return colors[community as keyof typeof colors] || colors.General;
  };

  const getSensitivityColor = (sensitivity: string) => {
    const colors = {
      'High': '#EF4444',
      'Medium': '#F59E0B',
      'Low': '#10B981'
    };
    return colors[sensitivity as keyof typeof colors] || colors.Low;
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{networkData.nodes.length}</div>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{networkData.connections.length}</div>
              <p className="text-sm text-muted-foreground">Connections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {new Set(networkData.nodes.map(n => n.community)).size}
              </div>
              <p className="text-sm text-muted-foreground">Communities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {Math.round((networkData.connections.length / (networkData.nodes.length * (networkData.nodes.length - 1) / 2)) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Connectivity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization (Simplified) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Network</CardTitle>
              <CardDescription>Visual representation of document relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-gray-50 rounded-lg overflow-hidden">
                {/* Simplified network visualization */}
                <div className="absolute inset-4">
                  {networkData.nodes.map((node, index) => {
                    const angle = (index / networkData.nodes.length) * 2 * Math.PI;
                    const radius = 120;
                    const x = 50 + (Math.cos(angle) * radius) / 3;
                    const y = 50 + (Math.sin(angle) * radius) / 3;
                    
                    return (
                      <div
                        key={node.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform"
                          style={{ backgroundColor: getCommunityColor(node.community) }}
                          title={node.title}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {networkData.connections.slice(0, 20).map((connection, index) => {
                      const sourceIndex = networkData.nodes.findIndex(n => n.id === connection.source);
                      const targetIndex = networkData.nodes.findIndex(n => n.id === connection.target);
                      
                      if (sourceIndex === -1 || targetIndex === -1) return null;
                      
                      const sourceAngle = (sourceIndex / networkData.nodes.length) * 2 * Math.PI;
                      const targetAngle = (targetIndex / networkData.nodes.length) * 2 * Math.PI;
                      const radius = 120;
                      
                      const x1 = 50 + (Math.cos(sourceAngle) * radius) / 3;
                      const y1 = 50 + (Math.sin(sourceAngle) * radius) / 3;
                      const x2 = 50 + (Math.cos(targetAngle) * radius) / 3;
                      const y2 = 50 + (Math.sin(targetAngle) * radius) / 3;
                      
                      return (
                        <line
                          key={index}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="#E5E7EB"
                          strokeWidth={Math.max(1, connection.strength * 3)}
                          opacity={connection.strength}
                        />
                      );
                    })}
                  </svg>
                </div>
                
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  Click nodes to view details • Lines show document relationships
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Node Details</CardTitle>
              <CardDescription>
                {selectedNode ? 'Document information' : 'Select a node to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Title</h4>
                    <p className="text-sm text-muted-foreground">{selectedNode.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Community</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCommunityColor(selectedNode.community) }}
                      />
                      <span className="text-sm">{selectedNode.community}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Cultural Sensitivity</h4>
                    <span
                      className="inline-block px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: getSensitivityColor(selectedNode.culturalSensitivity) + '20',
                        color: getSensitivityColor(selectedNode.culturalSensitivity)
                      }}
                    >
                      {selectedNode.culturalSensitivity}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Connections</h4>
                    <p className="text-sm text-muted-foreground">
                      {networkData.connections.filter(c => 
                        c.source === selectedNode.id || c.target === selectedNode.id
                      ).length} related documents
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Click on a node in the network to view document details and connections.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium mb-2">Communities</h5>
                  <div className="space-y-1">
                    {Array.from(new Set(networkData.nodes.map(n => n.community))).map(community => (
                      <div key={community} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCommunityColor(community) }}
                        />
                        <span className="text-xs">{community}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Connection Strength</h5>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <span className="text-xs">Weak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-gray-400"></div>
                      <span className="text-xs">Strong</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connection Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Analysis</CardTitle>
          <CardDescription>Strongest document relationships identified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkData.connections
              .sort((a, b) => b.strength - a.strength)
              .slice(0, 5)
              .map((connection, index) => {
                const sourceNode = networkData.nodes.find(n => n.id === connection.source);
                const targetNode = networkData.nodes.find(n => n.id === connection.target);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {sourceNode.title} ↔ {targetNode.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {connection.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {Math.round(connection.strength * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">strength</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}