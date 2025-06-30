'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core/Card';

interface Document {
  id: string;
  title: string;
  themes: string[];
  similarity?: number;
}

interface Link {
  source: string;
  target: string;
  strength: number;
}

export default function DocumentNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [, setHoveredDoc] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents/network');
      if (!response.ok) {
        // Fallback to sample data if API fails
        setDocuments([
          { id: 'doc1', title: 'Youth Empowerment Study 2024', themes: ['Youth Voice', 'Education'] },
          { id: 'doc2', title: 'Cultural Heritage Report', themes: ['Cultural Identity', 'Community'] },
          { id: 'doc3', title: 'Education Access Survey', themes: ['Education', 'Social Justice'] },
          { id: 'doc4', title: 'Community Health Assessment', themes: ['Health', 'Community'] },
          { id: 'doc5', title: 'Youth Leadership Program Evaluation', themes: ['Youth Voice', 'Leadership'] },
          { id: 'doc6', title: 'Traditional Knowledge Documentation', themes: ['Cultural Identity', 'Education'] },
        ]);
        setLinks([
          { source: 'doc1', target: 'doc5', strength: 0.9 },
          { source: 'doc1', target: 'doc3', strength: 0.7 },
          { source: 'doc2', target: 'doc6', strength: 0.85 },
          { source: 'doc3', target: 'doc5', strength: 0.6 },
          { source: 'doc4', target: 'doc1', strength: 0.5 },
          { source: 'doc6', target: 'doc3', strength: 0.65 },
        ]);
        return;
      }
      const data = await response.json();
      setDocuments(data.nodes || []);
      setLinks(data.links || []);
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create force simulation
    const simulation = d3.forceSimulation(documents as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => 150 * (1 - d.strength))
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', d => d.strength * 4)
      .attr('opacity', 0.6);

    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(documents)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .on('click', (_, d) => setSelectedDoc(d.id === selectedDoc ? null : d.id))
      .on('mouseenter', (_, d) => setHoveredDoc(d.id))
      .on('mouseleave', () => setHoveredDoc(null))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles
    node.append('circle')
      .attr('r', 30)
      .attr('fill', d => {
        const themeColors: Record<string, string> = {
          'Youth Voice': '#3b82f6',
          'Cultural Identity': '#8b5cf6',
          'Education': '#10b981',
          'Community': '#f97316',
          'Health': '#ec4899',
          'Leadership': '#6366f1',
          'Social Justice': '#ef4444'
        };
        const firstTheme = d.themes?.[0];
        return firstTheme ? themeColors[firstTheme] || '#6b7280' : '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3);

    // Add labels
    node.append('text')
      .text(d => d.title.split(' ').slice(0, 2).join(' ') + '...')
      .attr('text-anchor', 'middle')
      .attr('dy', 50)
      .attr('font-size', '12px')
      .attr('fill', '#374151');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
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

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [documents, links, selectedDoc]);

  const selectedDocument = documents.find(d => d.id === selectedDoc);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Similarity Network</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-gray-500">Loading network data...</span>
          </div>
        ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <svg ref={svgRef} className="w-full border rounded-lg bg-gray-50"></svg>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Network Overview</h3>
              <p className="text-sm text-gray-600">
                This network shows relationships between documents based on shared themes and content similarity.
                Stronger connections indicate higher similarity.
              </p>
            </div>

            {selectedDocument && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">{selectedDocument.title}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Themes:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDocument.themes.map(theme => (
                        <span key={theme} className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Connected to {links.filter(l => l.source === selectedDocument.id || l.target === selectedDocument.id).length} other documents
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span>Youth Voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span>Cultural Identity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Education</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>Community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}