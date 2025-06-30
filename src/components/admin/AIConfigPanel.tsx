'use client';

import { useState, useEffect } from 'react';

interface AIConfig {
  valid: boolean;
  errors: string[];
  currentConfig: {
    defaultModel: any;
    defaultEmbeddingModel: any;
    defaultProfile: any;
  };
  availableModels?: {
    ai: any[];
    embedding: any[];
  };
  processingProfiles?: any[];
}

interface CostEstimate {
  aiCost: number;
  embeddingCost: number;
  total: number;
}

export default function AIConfigPanel() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [documentWords, setDocumentWords] = useState(10000);
  const [costEstimates, setCostEstimates] = useState<Record<string, CostEstimate> | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai/config?includeModels=true&includeProfiles=true');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateCosts = async () => {
    setEstimating(true);
    try {
      const response = await fetch(`/api/ai/config?documentWords=${documentWords}&includeProfiles=true`);
      const data = await response.json();
      setCostEstimates(data.costEstimates);
    } catch (error) {
      console.error('Failed to estimate costs:', error);
    } finally {
      setEstimating(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading AI configuration...</div>;
  }

  if (!config) {
    return <div className="p-4 text-red-600">Failed to load AI configuration</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">AI Configuration</h2>

      {/* Configuration Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className={`p-4 rounded-lg ${config.valid ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`font-medium ${config.valid ? 'text-green-800' : 'text-red-800'}`}>
            {config.valid ? '✅ AI services configured correctly' : '❌ AI configuration has errors'}
          </p>
          {config.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-red-700">
              {config.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Current Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Current Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">AI Model</p>
            <p className="font-medium">{config.currentConfig.defaultModel?.model}</p>
            <p className="text-xs text-gray-500">{config.currentConfig.defaultModel?.description}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Embedding Model</p>
            <p className="font-medium">{config.currentConfig.defaultEmbeddingModel?.model}</p>
            <p className="text-xs text-gray-500">
              {config.currentConfig.defaultEmbeddingModel?.dimensions} dimensions
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Default Profile</p>
            <p className="font-medium capitalize">
              {config.currentConfig.defaultProfile?.aiModel || 'standard-analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Cost Estimator */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Cost Estimator</h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Size (words)
            </label>
            <input
              type="number"
              value={documentWords}
              onChange={(e) => setDocumentWords(parseInt(e.target.value) || 0)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              min="100"
              step="1000"
            />
          </div>
          <button
            onClick={estimateCosts}
            disabled={estimating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {estimating ? 'Estimating...' : 'Estimate Costs'}
          </button>
        </div>

        {costEstimates && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(costEstimates).map(([profile, estimate]) => (
              <div key={profile} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium capitalize text-sm">{profile.replace('-', ' ')}</p>
                <p className="text-lg font-bold text-green-600">${estimate.total.toFixed(3)}</p>
                <p className="text-xs text-gray-600">
                  AI: ${estimate.aiCost.toFixed(3)} | Embed: ${estimate.embeddingCost.toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Models */}
      {config.availableModels && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Available Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">AI Models</h4>
              <div className="space-y-2">
                {config.availableModels.ai.map((model) => (
                  <div key={model.key} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium">{model.model}</p>
                    <p className="text-gray-600">{model.description}</p>
                    <p className="text-xs text-gray-500">
                      Cost: ${model.costPer1kTokens.input}/${model.costPer1kTokens.output} per 1k
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Embedding Models</h4>
              <div className="space-y-2">
                {config.availableModels.embedding.map((model) => (
                  <div key={model.key} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium">{model.model}</p>
                    <p className="text-gray-600">{model.description}</p>
                    <p className="text-xs text-gray-500">
                      {model.dimensions}D | ${model.costPer1MTokens}/1M tokens
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Profiles */}
      {config.processingProfiles && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Processing Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.processingProfiles.map((profile) => (
              <div key={profile.key} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{profile.key.replace('-', ' ')}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Model: {profile.aiModel}</p>
                  <p>Embeddings: {profile.embeddingModel || 'None'}</p>
                  <p>Chunk Size: {profile.chunkSize}</p>
                  <p>Features: {[
                    profile.generateSummary && 'Summary',
                    profile.generateEmbeddings && 'Embeddings',
                  ].filter(Boolean).join(', ') || 'Basic'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}