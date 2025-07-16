/**
 * Entity Relationship Graph Component
 * Visualizes entity relationships as an interactive network graph
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/core/Card';

interface EntityNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  connectionCount: number;
  averageStrength: number;
}

interface RelationshipEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
  type: string;
  strength: number;
  description?: string;
}

interface EntityRelationshipGraphProps {
  documentId?: string;
  entityIds?: string[];
  height?: number;
  showControls?: boolean;
  onNodeClick?: (node: EntityNode) => void;
  onEdgeClick?: (edge: RelationshipEdge) => void;
}

export function EntityRelationshipGraph({
  documentId,
  entityIds,
  height = 400,
  showControls = true,
  onNodeClick,
  onEdgeClick
}: EntityRelationshipGraphProps) {
  const [relationships, setRelationships] = useState<RelationshipEdge[]>([]);
  const [nodes, setNodes] = useState<EntityNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [minStrength, setMinStrength] = useState(0.3);
  const [relationshipType, setRelationshipType] = useState<string>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch relationship data
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!documentId && (!entityIds || entityIds.length === 0)) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (documentId) params.set('documentId', documentId);
        if (entityIds && entityIds.length > 0) params.set('entityIds', entityIds.join(','));
        params.set('minStrength', minStrength.toString());
        if (relationshipType !== 'all') params.set('type', relationshipType);
        params.set('includeAnalysis', 'true');

        const response = await fetch(`/api/entities/relationships?${params}`);
        const data = await response.json();

        if (data.success) {
          const relationshipData = data.data.relationships || [];
          const analysisData = data.data.analysis || {};

          // Convert to graph format
          const edges: RelationshipEdge[] = relationshipData.map((rel: any) => ({
            id: rel.id,
            from: rel.fromEntityId,
            to: rel.toEntityId,
            relationship: rel.relationship,
            type: rel.type,
            strength: rel.strength,
            description: rel.description
          }));

          const nodeMap = new Map<string, EntityNode>();
          
          // Create nodes from entity connections
          if (analysisData.entityConnections) {
            analysisData.entityConnections.forEach((conn: any) => {
              nodeMap.set(conn.entityId, {
                id: conn.entityId,
                name: conn.entityName,
                type: conn.entityType,
                connectionCount: conn.connectionCount,
                averageStrength: conn.averageStrength
              });
            });
          }

          // Ensure all entities from relationships are included as nodes
          relationshipData.forEach((rel: any) => {
            if (rel.fromEntity && !nodeMap.has(rel.fromEntityId)) {
              nodeMap.set(rel.fromEntityId, {
                id: rel.fromEntityId,
                name: rel.fromEntity.name,
                type: rel.fromEntity.type,
                category: rel.fromEntity.category,
                connectionCount: 1,
                averageStrength: rel.strength
              });
            }
            if (rel.toEntity && !nodeMap.has(rel.toEntityId)) {
              nodeMap.set(rel.toEntityId, {
                id: rel.toEntityId,
                name: rel.toEntity.name,
                type: rel.toEntity.type,
                category: rel.toEntity.category,
                connectionCount: 1,
                averageStrength: rel.strength
              });
            }
          });

          setRelationships(edges);
          setNodes(Array.from(nodeMap.values()));
        } else {
          setError(data.error || 'Failed to fetch relationships');
        }
      } catch (err) {
        setError('Error fetching relationship data');
        console.error('Error fetching relationships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [documentId, entityIds, minStrength, relationshipType]);

  // Simple canvas-based graph rendering
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple force-directed layout simulation
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Initialize random positions
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(canvas.width, canvas.height) * 0.3;
      nodePositions.set(node.id, {
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius
      });
    });

    // Draw edges
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    relationships.forEach(edge => {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);
      
      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        
        // Line thickness based on strength
        ctx.lineWidth = Math.max(1, edge.strength * 4);
        
        // Color based on relationship type
        const colors = {
          hierarchical: '#ef4444',
          associative: '#3b82f6',
          causal: '#22c55e',
          temporal: '#f59e0b',
          spatial: '#8b5cf6'
        };
        ctx.strokeStyle = colors[edge.type as keyof typeof colors] || '#6b7280';
        
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      // Node size based on connection count
      const radius = Math.max(8, Math.min(20, 6 + node.connectionCount * 2));
      
      // Node color based on type
      const colors = {
        person: '#ef4444',
        organization: '#3b82f6',
        location: '#22c55e',
        concept: '#f59e0b',
        event: '#8b5cf6',
        product: '#ec4899',
        service: '#06b6d4',
        method: '#84cc16',
        tool: '#f97316'
      };
      
      const fillColor = colors[node.type as keyof typeof colors] || '#6b7280';
      const strokeColor = selectedNode === node.id ? '#000000' : '#ffffff';

      // Draw node
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = selectedNode === node.id ? 3 : 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.name.length > 15 ? node.name.substring(0, 12) + '...' : node.name,
        pos.x,
        pos.y + radius + 15
      );
    });

  }, [nodes, relationships, selectedNode, height]);

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on a node
    nodes.forEach(node => {
      // This is a simplified hit detection - in a real implementation you'd store positions
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = (nodes.indexOf(node) / nodes.length) * 2 * Math.PI;
      const radius = Math.min(canvas.width, canvas.height) * 0.3;
      const nodeX = centerX + Math.cos(angle) * radius;
      const nodeY = centerY + Math.sin(angle) * radius;
      const nodeRadius = Math.max(8, Math.min(20, 6 + node.connectionCount * 2));

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= nodeRadius) {
        setSelectedNode(selectedNode === node.id ? null : node.id);
        onNodeClick?.(node);
      }
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading relationship graph...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading relationship graph: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Entity Relationship Network</h3>
          <div className="text-sm text-gray-600">
            {nodes.length} entities, {relationships.length} relationships
          </div>
        </div>

        {showControls && (
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Min Strength:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minStrength}
                onChange={(e) => setMinStrength(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{minStrength}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Types</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="associative">Associative</option>
                <option value="causal">Causal</option>
                <option value="temporal">Temporal</option>
                <option value="spatial">Spatial</option>
              </select>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={height}
            onClick={handleCanvasClick}
            className="w-full cursor-pointer"
            style={{ height: `${height}px` }}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="font-semibold mb-2">Entity Types</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Person</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Organization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Concept</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Relationship Types</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span>Hierarchical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span>Associative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span>Causal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-yellow-500"></div>
                <span>Temporal</span>
              </div>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900">Selected Entity</h4>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              return node ? (
                <div className="mt-2 text-sm">
                  <p><strong>Name:</strong> {node.name}</p>
                  <p><strong>Type:</strong> {node.type}</p>
                  <p><strong>Connections:</strong> {node.connectionCount}</p>
                  <p><strong>Avg Strength:</strong> {node.averageStrength.toFixed(2)}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </Card>
  );
} 