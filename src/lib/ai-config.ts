/**
 * AI Configuration and Model Management
 * Centralizes all AI-related settings and model parameters
 */

export interface AIModelConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface EmbeddingModelConfig {
  provider: 'openai';
  model: string;
  dimensions: number;
}

// Predefined model configurations
export const AI_MODELS = {
  // OpenAI Models
  'gpt-4-turbo': {
    provider: 'openai' as const,
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 4096,
    description: 'Most capable model for complex analysis',
    costPer1kTokens: { input: 0.01, output: 0.03 }
  },
  'gpt-4': {
    provider: 'openai' as const,
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 8192,
    description: 'High quality, slower processing',
    costPer1kTokens: { input: 0.03, output: 0.06 }
  },
  'gpt-3.5-turbo': {
    provider: 'openai' as const,
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 4096,
    description: 'Fast and cost-effective',
    costPer1kTokens: { input: 0.0005, output: 0.0015 }
  },
  
  // Anthropic Models
  'claude-3.5-opus': {
    provider: 'anthropic' as const,
    model: 'claude-3-5-opus-latest',
    temperature: 0.3,
    maxTokens: 4096,
    description: 'Most capable Claude model - best for complex analysis',
    costPer1kTokens: { input: 0.015, output: 0.075 }
  },
  'claude-3.5-sonnet': {
    provider: 'anthropic' as const,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0.3,
    maxTokens: 4096,
    description: 'Fast and intelligent - great balance',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  'claude-3.5-haiku': {
    provider: 'anthropic' as const,
    model: 'claude-3-5-haiku-latest',
    temperature: 0.3,
    maxTokens: 4096,
    description: 'Fastest Claude model - good for high volume',
    costPer1kTokens: { input: 0.0008, output: 0.004 }
  }
} as const;

// Embedding model configurations
export const EMBEDDING_MODELS = {
  'text-embedding-3-small': {
    provider: 'openai' as const,
    model: 'text-embedding-3-small',
    dimensions: 1536,
    description: 'Fast and efficient embeddings',
    costPer1MTokens: 0.02
  },
  'text-embedding-3-large': {
    provider: 'openai' as const,
    model: 'text-embedding-3-large',
    dimensions: 3072,
    description: 'Higher quality embeddings',
    costPer1MTokens: 0.13
  },
  'text-embedding-ada-002': {
    provider: 'openai' as const,
    model: 'text-embedding-ada-002',
    dimensions: 1536,
    description: 'Legacy model, still supported',
    costPer1MTokens: 0.10
  }
} as const;

// Processing profiles for different use cases
export const PROCESSING_PROFILES = {
  'quick-analysis': {
    aiModel: 'gpt-3.5-turbo',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 2000,
    overlapSize: 200,
    generateSummary: false,
    generateEmbeddings: true,
    maxThemes: 5,
    maxQuotes: 10,
    maxInsights: 5
  },
  'standard-analysis': {
    aiModel: 'gpt-4-turbo',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 2000,
    overlapSize: 200,
    generateSummary: true,
    generateEmbeddings: true,
    maxThemes: 8,
    maxQuotes: 20,
    maxInsights: 15
  },
  'deep-analysis': {
    aiModel: 'gpt-4',
    embeddingModel: 'text-embedding-3-large',
    chunkSize: 3000,
    overlapSize: 300,
    generateSummary: true,
    generateEmbeddings: true,
    maxThemes: 10,
    maxQuotes: 30,
    maxInsights: 20
  },
  'claude-quick': {
    aiModel: 'claude-3.5-haiku',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 2000,
    overlapSize: 200,
    generateSummary: false,
    generateEmbeddings: true,
    maxThemes: 5,
    maxQuotes: 10,
    maxInsights: 5
  },
  'claude-standard': {
    aiModel: 'claude-3.5-sonnet',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 2500,
    overlapSize: 250,
    generateSummary: true,
    generateEmbeddings: true,
    maxThemes: 8,
    maxQuotes: 20,
    maxInsights: 15
  },
  'cost-optimized': {
    aiModel: 'gpt-3.5-turbo',
    embeddingModel: null, // No embeddings
    chunkSize: 1500,
    overlapSize: 150,
    generateSummary: false,
    generateEmbeddings: false,
    maxThemes: 5,
    maxQuotes: 10,
    maxInsights: 5
  }
} as const;

// Configuration class
export class AIConfiguration {
  private static instance: AIConfiguration;
  private config: {
    defaultModel: keyof typeof AI_MODELS;
    defaultEmbeddingModel: keyof typeof EMBEDDING_MODELS;
    defaultProfile: keyof typeof PROCESSING_PROFILES;
    customPrompts: Record<string, string>;
  };

  private constructor() {
    this.config = {
      defaultModel: (process.env.AI_DEFAULT_MODEL as keyof typeof AI_MODELS) || 'gpt-4-turbo',
      defaultEmbeddingModel: (process.env.AI_DEFAULT_EMBEDDING_MODEL as keyof typeof EMBEDDING_MODELS) || 'text-embedding-3-small',
      defaultProfile: (process.env.AI_DEFAULT_PROFILE as keyof typeof PROCESSING_PROFILES) || 'standard-analysis',
      customPrompts: {}
    };
  }

  static getInstance(): AIConfiguration {
    if (!AIConfiguration.instance) {
      AIConfiguration.instance = new AIConfiguration();
    }
    return AIConfiguration.instance;
  }

  getModelConfig(modelName?: keyof typeof AI_MODELS): AIModelConfig {
    const model = modelName || this.config.defaultModel;
    return AI_MODELS[model];
  }

  getEmbeddingConfig(modelName?: keyof typeof EMBEDDING_MODELS): EmbeddingModelConfig {
    const model = modelName || this.config.defaultEmbeddingModel;
    return EMBEDDING_MODELS[model];
  }

  getProcessingProfile(profileName?: keyof typeof PROCESSING_PROFILES) {
    const profile = profileName || this.config.defaultProfile;
    return PROCESSING_PROFILES[profile];
  }

  // Custom prompt management
  setCustomPrompt(key: string, prompt: string) {
    this.config.customPrompts[key] = prompt;
  }

  getCustomPrompt(key: string): string | undefined {
    return this.config.customPrompts[key];
  }

  // Cost estimation
  estimateProcessingCost(
    documentWords: number,
    profile: keyof typeof PROCESSING_PROFILES = 'standard-analysis'
  ): { aiCost: number; embeddingCost: number; total: number } {
    const processingProfile = this.getProcessingProfile(profile);
    const aiModel = AI_MODELS[processingProfile.aiModel as keyof typeof AI_MODELS];
    
    // Estimate tokens (rough: 1 word ≈ 1.3 tokens)
    const estimatedTokens = documentWords * 1.3;
    
    // AI cost (assuming 50% input, 50% output for analysis)
    const aiCost = aiModel
      ? (estimatedTokens / 1000) * 
        ((aiModel.costPer1kTokens.input * 0.5) + (aiModel.costPer1kTokens.output * 0.5))
      : 0;
    
    // Embedding cost
    let embeddingCost = 0;
    if (processingProfile.generateEmbeddings && processingProfile.embeddingModel) {
      const embeddingModel = EMBEDDING_MODELS[processingProfile.embeddingModel as keyof typeof EMBEDDING_MODELS];
      embeddingCost = (estimatedTokens / 1000000) * embeddingModel.costPer1MTokens;
    }
    
    return {
      aiCost: Math.round(aiCost * 1000) / 1000,
      embeddingCost: Math.round(embeddingCost * 1000) / 1000,
      total: Math.round((aiCost + embeddingCost) * 1000) / 1000
    };
  }

  // Get available models by provider
  getModelsByProvider(provider: 'openai' | 'anthropic') {
    return Object.entries(AI_MODELS)
      .filter(([, config]) => config.provider === provider)
      .map(([name, config]) => ({ name, ...config }));
  }

  // Validate configuration
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check API keys
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      errors.push('No AI provider API key configured');
    }
    
    // Check model availability
    const defaultModel = this.getModelConfig();
    if (defaultModel.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      errors.push('OpenAI API key required for selected model');
    }
    if (defaultModel.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      errors.push('Anthropic API key required for selected model');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const aiConfig = AIConfiguration.getInstance();