'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SystemConnection } from '@/data/schemas';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/core';
import { cn } from '@/utils/cn';

export interface SystemNode {
  id: string;
  label: string;
  type: 'service' | 'theme' | 'outcome' | 'factor';
  group?: string;
}

export interface SystemsMapProps {
  nodes: SystemNode[];
  connections: SystemConnection[];
  className?: string;
  height?: number;
}

/**
 * Interactive systems map visualization using D3.js
 * Shows relationships between services, themes, and outcomes
 */
export const SystemsMap: React.FC<SystemsMapProps> = ({
  nodes,
  connections,
  className,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['service', 'theme', 'outcome', 'factor'])
      .range(['#0c9eeb', '#e85229', '#10b981', '#886859']);

    // Create force simulation
    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(connections)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow markers for different connection types
    const defs = svg.append('defs');
    
    ['supports', 'blocks', 'influences', 'requires', 'enables'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', type === 'blocks' ? '#ef4444' : '#6b7280');
    });

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(connections)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d: SystemConnection) => 
        d.type === 'blocks' ? '#ef4444' : '#6b7280'
      )
      .attr('stroke-width', (d: SystemConnection) => {
        switch (d.strength) {
          case 'strong': return 3;
          case 'medium': return 2;
          case 'weak': return 1;
          default: return 2;
        }
      })
      .attr('stroke-dasharray', (d: SystemConnection) => 
        d.type === 'blocks' ? '5,5' : 'none'
      )
      .attr('marker-end', (d: SystemConnection) => 
        `url(#arrow-${d.type})`
      )
      .style('opacity', 0.6);

    // Create link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(connections)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .text((d: SystemConnection) => d.type);

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

    // Add circles to nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: SystemNode) => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', handleNodeHover)
      .on('mouseout', handleNodeLeave)
      .on('click', handleNodeClick);

    // Add labels to nodes
    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d: SystemNode) => {
        // Truncate long labels
        return d.label.length > 15 ? d.label.substring(0, 12) + '...' : d.label;
      });

    // Add tooltips
    node.append('title')
      .text((d: SystemNode) => d.label);

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
      
      // Highlight connected nodes
      link.style('opacity', (l: any) => 
        l.source.id === d.id || l.target.id === d.id ? 1 : 0.2
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
      link.style('opacity', 0.6);
      node.style('opacity', 1);
    }

    function handleNodeClick(_event: any, d: SystemNode) {
      setSelectedNode(d.id === selectedNode ? null : d.id);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, connections, height]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const connectedNodes = selectedNode ? connections
    .filter(c => c.from === selectedNode || c.to === selectedNode)
    .map(c => {
      const targetId = c.from === selectedNode ? c.to : c.from;
      const targetNode = nodes.find(n => n.id === targetId);
      return {
        ...c,
        targetNode
      };
    }) : [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Systems Map</CardTitle>
        <CardDescription>
          Explore how different elements in the youth support system connect and influence each other
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
            <p className="text-xs font-medium mb-2">Node Types</p>
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

          {/* Selected Node Info */}
          {selectedNodeData && (
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-xs">
              <h4 className="font-medium mb-2">{selectedNodeData.label}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Type: {selectedNodeData.type}
              </p>
              {connectedNodes.length > 0 && (
                <>
                  <p className="text-sm font-medium mb-2">Connections:</p>
                  <ul className="space-y-1">
                    {connectedNodes.map((conn, idx) => (
                      <li key={idx} className="text-xs">
                        <span className={cn(
                          'font-medium',
                          conn.type === 'blocks' && 'text-destructive'
                        )}>
                          {conn.type}
                        </span>
                        {' '}
                        {conn.targetNode?.label || 'Unknown'}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* Connection Types */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <p className="font-medium">Connection Types:</p>
          {[
            { type: 'supports', label: 'Supports', color: '#6b7280' },
            { type: 'blocks', label: 'Blocks', color: '#ef4444' },
            { type: 'enables', label: 'Enables', color: '#6b7280' },
            { type: 'influences', label: 'Influences', color: '#6b7280' },
            { type: 'requires', label: 'Requires', color: '#6b7280' }
          ].map(item => (
            <div key={item.type} className="flex items-center gap-1">
              <svg width="20" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="20"
                  y2="5"
                  stroke={item.color}
                  strokeWidth="2"
                  strokeDasharray={item.type === 'blocks' ? '3,3' : 'none'}
                />
              </svg>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};