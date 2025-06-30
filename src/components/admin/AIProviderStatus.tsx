'use client';

import { useState, useEffect } from 'react';

interface ProviderStatus {
  provider: 'openai' | 'anthropic' | null;
  model: string;
  available: boolean;
}

export default function AIProviderStatus() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      
      if (data.currentConfig?.defaultModel) {
        setStatus({
          provider: data.currentConfig.defaultModel.provider,
          model: data.currentConfig.defaultModel.model,
          available: data.valid
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>;
  }

  if (!status || !status.available) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
        No AI Provider
      </div>
    );
  }

  const providerColors = {
    openai: 'bg-green-100 text-green-700',
    anthropic: 'bg-purple-100 text-purple-700'
  };

  const providerLabels = {
    openai: 'OpenAI',
    anthropic: 'Anthropic'
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${providerColors[status.provider] || 'bg-gray-100 text-gray-700'}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${status.provider === 'anthropic' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
      {providerLabels[status.provider]} - {status.model}
    </div>
  );
}