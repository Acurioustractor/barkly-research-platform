import { useState, useEffect } from 'react';

interface Theme {
  name: string;
  count: number;
  avgConfidence: number;
}

interface Insight {
  id: string;
  text: string;
  type: string;
  confidence: number;
  documentId: string;
  documentName: string;
}

interface Quote {
  id: string;
  text: string;
  context: string | null;
  speaker: string | null;
  confidence: number;
  documentId: string;
  documentName: string;
}

interface Keyword {
  term: string;
  category: string | null;
  frequency: number;
  relevance: number;
}

interface InsightsData {
  statistics: {
    totalDocuments: number;
    completedDocuments: number;
    totalChunks: number;
    successRate: string;
  };
  themes: Theme[];
  insights: Insight[];
  quotes: Quote[];
  keywords: Keyword[];
}

export function useDocumentInsights(theme?: string) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [theme]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (theme) params.append('theme', theme);
      
      const response = await fetch(`/api/documents/insights?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchInsights };
}