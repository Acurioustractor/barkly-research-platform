import { useState, useEffect } from 'react';

export interface SystemNode {
  id: string;
  label: string;
  type: 'service' | 'theme' | 'outcome' | 'factor';
  documents: string[];
  confidence: number;
}

export interface SystemConnection {
  id: string;
  from: string;
  to: string;
  type: 'supports' | 'blocks' | 'enables' | 'influences' | 'requires';
  strength: 'strong' | 'medium' | 'weak';
  description: string;
  documents: string[];
  confidence: number;
}

export interface SystemsMapData {
  nodes: SystemNode[];
  connections: SystemConnection[];
  documents: Array<{
    id: string;
    originalName: string;
    uploadedAt: string;
    category: string | null;
    tags: any;
  }>;
  filters: {
    entityTypes: string[];
    minConfidence: number;
  };
}

interface UseSystemsMapOptions {
  documentIds?: string[];
  entityTypes?: string[];
  minConfidence?: number;
}

export function useSystemsMap(options: UseSystemsMapOptions = {}) {
  const [data, setData] = useState<SystemsMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemsMap();
  }, [options.documentIds, options.entityTypes, options.minConfidence]);

  const fetchSystemsMap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.documentIds && options.documentIds.length > 0) {
        params.append('documentIds', options.documentIds.join(','));
      }
      if (options.entityTypes && options.entityTypes.length > 0) {
        params.append('entityTypes', options.entityTypes.join(','));
      }
      if (options.minConfidence !== undefined) {
        params.append('minConfidence', options.minConfidence.toString());
      }
      
      const response = await fetch(`/api/documents/systems-map?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch systems map');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Systems map fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSystemsMap = async (name: string, description?: string, layout?: any) => {
    if (!data) return null;

    try {
      const response = await fetch('/api/documents/systems-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          documentIds: data.documents.map(d => d.id),
          filters: data.filters,
          layout
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save systems map');
      }

      return await response.json();
    } catch (err) {
      console.error('Systems map save error:', err);
      throw err;
    }
  };

  return { data, loading, error, refetch: fetchSystemsMap, save: saveSystemsMap };
}