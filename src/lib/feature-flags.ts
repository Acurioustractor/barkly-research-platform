/**
 * Feature flags system for controlled rollout and A/B testing
 * Allows runtime toggling of features without code changes
 */

import { config, features } from './config';

// Feature flag definitions
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  requiresCapability?: () => boolean;
  experimental?: boolean;
}

// Define all feature flags
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core features
  AI_ANALYSIS: {
    key: 'AI_ANALYSIS',
    name: 'AI-Powered Analysis',
    description: 'Enable AI analysis for document processing',
    defaultEnabled: true,
    requiresCapability: () => features.hasAnyAI(),
  },
  
  EMBEDDINGS: {
    key: 'EMBEDDINGS',
    name: 'Semantic Search',
    description: 'Generate embeddings for semantic search',
    defaultEnabled: true,
    requiresCapability: () => features.hasOpenAI(),
  },
  
  PARALLEL_PROCESSING: {
    key: 'PARALLEL_PROCESSING',
    name: 'Parallel Processing',
    description: 'Process multiple documents concurrently',
    defaultEnabled: true,
  },
  
  // Advanced features
  CROSS_CHUNK_ANALYSIS: {
    key: 'CROSS_CHUNK_ANALYSIS',
    name: 'Cross-Chunk Analysis',
    description: 'Analyze relationships between document chunks',
    defaultEnabled: true,
    requiresCapability: () => features.hasAnyAI(),
  },
  
  ENTITY_EXTRACTION: {
    key: 'ENTITY_EXTRACTION',
    name: 'Entity Extraction',
    description: 'Extract named entities from documents',
    defaultEnabled: true,
    requiresCapability: () => features.hasAnyAI(),
  },
  
  SENTIMENT_ANALYSIS: {
    key: 'SENTIMENT_ANALYSIS',
    name: 'Sentiment Analysis',
    description: 'Analyze sentiment in document content',
    defaultEnabled: false,
    requiresCapability: () => features.hasAnyAI(),
    experimental: true,
  },
  
  // UI features
  VISUALIZATIONS: {
    key: 'VISUALIZATIONS',
    name: 'Data Visualizations',
    description: 'Show charts and graphs for insights',
    defaultEnabled: true,
  },
  
  NETWORK_GRAPH: {
    key: 'NETWORK_GRAPH',
    name: 'Network Graph',
    description: 'Display document relationships as network',
    defaultEnabled: true,
  },
  
  // Experimental features
  AUTO_CATEGORIZATION: {
    key: 'AUTO_CATEGORIZATION',
    name: 'Auto-Categorization',
    description: 'Automatically categorize uploaded documents',
    defaultEnabled: false,
    experimental: true,
    requiresCapability: () => features.hasAnyAI(),
  },
  
  SMART_CHUNKING: {
    key: 'SMART_CHUNKING',
    name: 'Smart Chunking',
    description: 'Use AI to determine optimal chunk boundaries',
    defaultEnabled: false,
    experimental: true,
    requiresCapability: () => features.hasAnyAI(),
  },
};

// Feature flag manager
class FeatureFlagManager {
  private overrides: Map<string, boolean> = new Map();
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }
    
    // Check override first
    if (this.overrides.has(flagKey)) {
      return this.overrides.get(flagKey)!;
    }
    
    // Check capability requirements
    if (flag.requiresCapability && !flag.requiresCapability()) {
      return false;
    }
    
    // Check environment-based config
    const envKey = `ENABLE_${flagKey}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return envValue === 'true';
    }
    
    // Use default
    return flag.defaultEnabled;
  }
  
  /**
   * Override a feature flag value (for testing)
   */
  override(flagKey: string, enabled: boolean) {
    this.overrides.set(flagKey, enabled);
  }
  
  /**
   * Clear all overrides
   */
  clearOverrides() {
    this.overrides.clear();
  }
  
  /**
   * Get all feature flags with their current status
   */
  getAllFlags(): Array<{
    key: string;
    flag: FeatureFlag;
    enabled: boolean;
    reason?: string;
  }> {
    return Object.entries(FEATURE_FLAGS).map(([key, flag]) => {
      const enabled = this.isEnabled(key);
      let reason: string | undefined;
      
      if (!enabled) {
        if (flag.requiresCapability && !flag.requiresCapability()) {
          reason = 'Required capability not available';
        } else if (this.overrides.has(key)) {
          reason = 'Manually disabled';
        } else if (process.env[`ENABLE_${key}`] === 'false') {
          reason = 'Disabled by environment variable';
        }
      }
      
      return { key, flag, enabled, reason };
    });
  }
  
  /**
   * Get enabled features for logging
   */
  getEnabledFeatures(): string[] {
    return this.getAllFlags()
      .filter(({ enabled }) => enabled)
      .map(({ flag }) => flag.name);
  }
  
  /**
   * Get experimental features
   */
  getExperimentalFeatures(): string[] {
    return this.getAllFlags()
      .filter(({ flag, enabled }) => flag.experimental && enabled)
      .map(({ flag }) => flag.name);
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();

// Convenience functions for common checks
export const isFeatureEnabled = (flagKey: string) => featureFlags.isEnabled(flagKey);

export const featureChecks = {
  aiAnalysis: () => isFeatureEnabled('AI_ANALYSIS'),
  embeddings: () => isFeatureEnabled('EMBEDDINGS'),
  parallelProcessing: () => isFeatureEnabled('PARALLEL_PROCESSING'),
  crossChunkAnalysis: () => isFeatureEnabled('CROSS_CHUNK_ANALYSIS'),
  entityExtraction: () => isFeatureEnabled('ENTITY_EXTRACTION'),
  sentimentAnalysis: () => isFeatureEnabled('SENTIMENT_ANALYSIS'),
  visualizations: () => isFeatureEnabled('VISUALIZATIONS'),
  networkGraph: () => isFeatureEnabled('NETWORK_GRAPH'),
  autoCategorization: () => isFeatureEnabled('AUTO_CATEGORIZATION'),
  smartChunking: () => isFeatureEnabled('SMART_CHUNKING'),
};

// Log feature status on startup
if (typeof window === 'undefined') { // Server only
  console.log('📋 Feature Flags Status:');
  const allFlags = featureFlags.getAllFlags();
  
  const enabledFeatures = allFlags.filter(f => f.enabled);
  const disabledFeatures = allFlags.filter(f => !f.enabled);
  const experimentalFeatures = featureFlags.getExperimentalFeatures();
  
  if (enabledFeatures.length > 0) {
    console.log(`✅ Enabled: ${enabledFeatures.map(f => f.flag.name).join(', ')}`);
  }
  
  if (disabledFeatures.length > 0) {
    console.log(`❌ Disabled: ${disabledFeatures.map(f => `${f.flag.name} (${f.reason || 'default'})`).join(', ')}`);
  }
  
  if (experimentalFeatures.length > 0) {
    console.log(`🧪 Experimental: ${experimentalFeatures.join(', ')}`);
  }
}