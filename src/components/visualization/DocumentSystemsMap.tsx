'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core';
import { Button } from '@/components/core/Button';
import { cn } from '@/utils/cn';
import type { SystemNode, SystemConnection } from '@/hooks/useSystemsMap';

export interface DocumentSystemsMapProps {
  nodes: SystemNode[];
  connections: SystemConnection[];
  documents?: Array<{
    id: string;
    originalName: string;
    category: string | null;
  }>;
  className?: string;
  height?: number;
  showConfidence?: boolean;
  showDocumentSources?: boolean;
  onNodeClick?: (node: SystemNode) => void;
  onConnectionClick?: (connection: SystemConnection) => void;
}

/**
 * Enhanced systems map visualization with document evidence
 */
export const DocumentSystemsMap: React.FC<DocumentSystemsMapProps> = ({
  nodes,
  connections,
  documents = [],
  className,
  height = 600,
  showConfidence = true,
  showDocumentSources = true,
  onNodeClick,
  onConnectionClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // If no nodes, show empty state
    if (nodes.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth || 800;
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-muted-foreground text-sm')
        .text('No systems data available. Upload documents with systems extraction enabled.');
      return;
    }

    const width = svgRef.current.clientWidth;
    if (width === 0) {
      const timer = setTimeout(() => {
        if (svgRef.current) {
          const retryWidth = svgRef.current.clientWidth;
          if (retryWidth > 0) {
            initializeVisualization();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    return initializeVisualization();

    function initializeVisualization() {
      if (!svgRef.current) return;

      // Clear previous visualization
      d3.select(svgRef.current).selectAll('*').remove();

      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth || 800;
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Create main group with zoom support
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Add zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Enhanced color scale with confidence-based opacity
      const colorScale = d3.scaleOrdinal<string>()
        .domain(['service', 'theme', 'outcome', 'factor'])
        .range(['#0c9eeb', '#e85229', '#10b981', '#886859']);

      // Size scale based on document count
      const sizeScale = d3.scaleLinear()
        .domain([0, d3.max(nodes, d => d.documents.length) || 1])
        .range([20, 35]);

      // Validate connections and filter out invalid ones
      const validConnections = (connections || []).filter(conn => {
        const fromExists = nodes.some(node => node.id === conn.from);
        const toExists = nodes.some(node => node.id === conn.to);
        if (!fromExists || !toExists) {
          console.warn(`Invalid connection: ${conn.from} -> ${conn.to}`, { fromExists, toExists });
          return false;
        }
        return true;
      });

      // Create force simulation with stronger forces for better separation
      const simulation = d3.forceSimulation<any>(nodes)
        .force('link', d3.forceLink<any, any>(validConnections)
          .id((d: any) => d.id)
          .distance(120))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
        .force('collision', d3.forceCollide()
          .radius((d: any) => sizeScale(d.documents.length) + 10));

      // Create arrow markers with different styles
      const defs = svg.append('defs');
      
      ['supports', 'blocks', 'influences', 'requires', 'enables'].forEach(type => {
        defs.append('marker')
          .attr('id', `arrow-${type}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 30)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', type === 'blocks' ? '#ef4444' : '#6b7280');
      });

      // Create links with varying width based on confidence
      const link = g.append('g')
        .selectAll('line')
        .data(validConnections)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', (d: SystemConnection) => 
          d.type === 'blocks' ? '#ef4444' : '#6b7280'
        )
        .attr('stroke-width', (d: SystemConnection) => {
          const baseWidth = d.strength === 'strong' ? 3 : d.strength === 'medium' ? 2 : 1;
          return showConfidence ? baseWidth * d.confidence : baseWidth;
        })
        .attr('stroke-dasharray', (d: SystemConnection) => 
          d.type === 'blocks' ? '5,5' : 'none'
        )
        .attr('marker-end', (d: SystemConnection) => 
          `url(#arrow-${d.type})`
        )
        .style('opacity', (d: SystemConnection) => 
          showConfidence ? 0.3 + (d.confidence * 0.7) : 0.6
        )
        .style('cursor', 'pointer')
        .on('click', handleConnectionClick)
        .on('mouseover', handleConnectionHover)
        .on('mouseout', handleConnectionLeave);

      // Create link labels
      const linkLabel = g.append('g')
        .selectAll('text')
        .data(validConnections)
        .enter()
        .append('text')
        .attr('class', 'link-label')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .attr('text-anchor', 'middle')
        .text((d: SystemConnection) => d.type)
        .style('opacity', 0);

      // Create nodes
      const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('cursor', 'pointer')
        .call(d3.drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      // Add circles with dynamic sizing
      node.append('circle')
        .attr('r', (d: SystemNode) => sizeScale(d.documents.length))
        .attr('fill', (d: SystemNode) => colorScale(d.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('opacity', (d: SystemNode) => 
          showConfidence ? 0.5 + (d.confidence * 0.5) : 1
        )
        .on('mouseover', handleNodeHover)
        .on('mouseout', handleNodeLeave)
        .on('click', handleNodeClick);

      // Add confidence rings if enabled
      if (showConfidence) {
        node.append('circle')
          .attr('r', (d: SystemNode) => sizeScale(d.documents.length) + 5)
          .attr('fill', 'none')
          .attr('stroke', (d: SystemNode) => colorScale(d.type))
          .attr('stroke-width', (d: SystemNode) => d.confidence * 3)
          .style('opacity', 0.3);
      }

      // Add labels
      node.append('text')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'medium')
        .attr('fill', '#fff')
        .attr('pointer-events', 'none')
        .text((d: SystemNode) => {
          return d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label;
        });

      // Add document count badges
      if (showDocumentSources) {
        node.append('text')
          .attr('dy', (d: SystemNode) => sizeScale(d.documents.length) + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#6b7280')
          .text((d: SystemNode) => `${d.documents.length} docs`);
      }

      // Add tooltips
      node.append('title')
        .text((d: SystemNode) => 
          `${d.label}\nType: ${d.type}\nConfidence: ${(d.confidence * 100).toFixed(0)}%\nFound in ${d.documents.length} documents`
        );

      // Update positions on tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        linkLabel
          .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
          .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

        node
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      // Drag functions
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      function handleNodeHover(_event: any, d: SystemNode) {
        setHoveredNode(d.id);
        
        // Highlight connected nodes and links
        link.style('opacity', (l: any) => 
          l.source.id === d.id || l.target.id === d.id 
            ? 1 
            : 0.1
        );
        
        linkLabel.style('opacity', (l: any) => 
          l.source.id === d.id || l.target.id === d.id 
            ? 1 
            : 0
        );
        
        node.style('opacity', (n: any) => {
          if (n.id === d.id) return 1;
          const isConnected = connections.some((c: SystemConnection) => 
            (c.from === d.id && c.to === n.id) || 
            (c.to === d.id && c.from === n.id)
          );
          return isConnected ? 1 : 0.3;
        });
      }

      function handleNodeLeave() {
        setHoveredNode(null);
        link.style('opacity', (d: SystemConnection) => 
          showConfidence ? 0.3 + (d.confidence * 0.7) : 0.6
        );
        linkLabel.style('opacity', 0);
        node.style('opacity', 1);
      }

      function handleNodeClick(_event: any, d: SystemNode) {
        setSelectedNode(d.id === selectedNode ? null : d.id);
        setSelectedConnection(null);
        if (onNodeClick) {
          onNodeClick(d);
        }
      }

      function handleConnectionClick(_event: any, d: SystemConnection) {
        _event.stopPropagation();
        setSelectedConnection(d.id === selectedConnection ? null : d.id);
        setSelectedNode(null);
        if (onConnectionClick) {
          onConnectionClick(d);
        }
      }

      function handleConnectionHover(_event: any, d: SystemConnection) {
        linkLabel.style('opacity', (l: any) => l.id === d.id ? 1 : 0);
      }

      function handleConnectionLeave() {
        linkLabel.style('opacity', 0);
      }

      // Cleanup
      return () => {
        simulation.stop();
      };
    }
  }, [nodes, connections, height, showConfidence, showDocumentSources]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const selectedConnectionData = connections.find(c => c.id === selectedConnection);
  
  const connectedNodes = selectedNode ? connections
    .filter(c => c.from === selectedNode || c.to === selectedNode)
    .map(c => {
      const targetId = c.from === selectedNode ? c.to : c.from;
      const targetNode = nodes.find(n => n.id === targetId);
      return {
        ...c,
        targetNode,
        direction: c.from === selectedNode ? 'outgoing' : 'incoming'
      };
    }) : [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Systems Map</CardTitle>
        <CardDescription>
          Generated from {documents.length} documents • {nodes.length} entities • {connections.length} relationships
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="relative">
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            className="border rounded-lg bg-muted/20"
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium mb-2">Entity Types</p>
            <div className="space-y-1">
              {[
                { type: 'service', color: '#0c9eeb', label: 'Services' },
                { type: 'theme', color: '#e85229', label: 'Themes' },
                { type: 'outcome', color: '#10b981', label: 'Outcomes' },
                { type: 'factor', color: '#886859', label: 'Factors' }
              ].map(item => (
                <div key={item.type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Entity Info */}
          {selectedNodeData && (
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
              <h4 className="font-medium mb-2">{selectedNodeData.label}</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Type: {selectedNodeData.type}
                </p>
                {showConfidence && (
                  <p className="text-muted-foreground">
                    Confidence: {(selectedNodeData.confidence * 100).toFixed(0)}%
                  </p>
                )}
                {showDocumentSources && (
                  <div>
                    <p className="font-medium mb-1">Found in documents:</p>
                    <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                      {selectedNodeData.documents.map((doc, idx) => (
                        <li key={idx} className="text-muted-foreground truncate">
                          • {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {connectedNodes.length > 0 && (
                  <>
                    <p className="font-medium mb-1 mt-3">Connections:</p>
                    <ul className="space-y-1">
                      {connectedNodes.map((conn, idx) => (
                        <li key={idx} className="text-xs">
                          <span className={cn(
                            'font-medium',
                            conn.type === 'blocks' && 'text-destructive',
                            conn.direction === 'outgoing' ? 'text-blue-600' : 'text-orange-600'
                          )}>
                            {conn.direction === 'outgoing' ? '→' : '←'} {conn.type}
                          </span>
                          {' '}
                          {conn.targetNode?.label || 'Unknown'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Selected Connection Info */}
          {selectedConnectionData && (
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
              <h4 className="font-medium mb-2">Connection Details</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">From:</span> {nodes.find(n => n.id === selectedConnectionData.from)?.label}
                </p>
                <p>
                  <span className="font-medium">To:</span> {nodes.find(n => n.id === selectedConnectionData.to)?.label}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {selectedConnectionData.type}
                </p>
                <p>
                  <span className="font-medium">Strength:</span> {selectedConnectionData.strength}
                </p>
                {showConfidence && (
                  <p>
                    <span className="font-medium">Confidence:</span> {(selectedConnectionData.confidence * 100).toFixed(0)}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedConnectionData.description}
                </p>
                {showDocumentSources && (
                  <div className="mt-2">
                    <p className="font-medium mb-1 text-xs">Evidence from:</p>
                    <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                      {selectedConnectionData.documents.map((doc, idx) => (
                        <li key={idx} className="text-muted-foreground truncate">
                          • {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <p className="text-muted-foreground">
              Click nodes or connections to see details • Drag to reposition • Scroll to zoom
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedNode(null);
                setSelectedConnection(null);
              }}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};