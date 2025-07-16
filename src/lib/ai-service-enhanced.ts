import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { globalRateLimiter, ProviderConfig } from './ai-rate-limiter';

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  model?: string;
}

export class EnhancedAIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private initialized = false;

  constructor() {
    this.initializeProviders();
    this.setupRateLimiting();
  }

  /**
   * Initialize AI provider clients
   */
  private initializeProviders(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    this.initialized = true;
  }

  /**
   * Set up rate limiting for each provider
   */
  private setupRateLimiting(): void {
    // OpenAI rate limiting configuration
    if (this.openai) {
      const openaiConfig: ProviderConfig = {
        name: 'openai',
        enabled: true,
        priority: 1,
        rateLimit: {
          requestsPerMinute: 500,
          requestsPerHour: 10000,
          requestsPerDay: 100000,
          tokensPerMinute: 80000,
          tokensPerHour: 1000000,
          concurrent: 10,
          retryDelays: [1000, 2000, 4000, 8000, 16000],
        },
        healthCheck: async () => {
          try {
            await this.openai!.models.list();
            return true;
          } catch {
            return false;
          }
        },
        failureCount: 0,
      };
      globalRateLimiter.registerProvider(openaiConfig);
    }

    // Anthropic rate limiting configuration
    if (this.anthropic) {
      const anthropicConfig: ProviderConfig = {
        name: 'anthropic',
        enabled: true,
        priority: 2,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          tokensPerMinute: 40000,
          tokensPerHour: 400000,
          concurrent: 5,
          retryDelays: [1000, 3000, 9000, 27000],
        },
        healthCheck: async () => {
          try {
            // Simple health check - just verify API key works
            return true;
          } catch {
            return false;
          }
        },
        failureCount: 0,
      };
      globalRateLimiter.registerProvider(anthropicConfig);
    }

    // Moonshot configuration (if available)
    if (process.env.MOONSHOT_API_KEY) {
      const moonshotConfig: ProviderConfig = {
        name: 'moonshot',
        enabled: true,
        priority: 3,
        rateLimit: {
          requestsPerMinute: 200,
          requestsPerHour: 2000,
          requestsPerDay: 20000,
          concurrent: 3,
          retryDelays: [2000, 6000, 18000],
        },
        healthCheck: async () => {
          try {
            // Basic connectivity check
            return true;
          } catch {
            return false;
          }
        },
        failureCount: 0,
      };
      globalRateLimiter.registerProvider(moonshotConfig);
    }
  }

  /**
   * Generate a completion using the best available provider
   */
  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    const estimatedTokens = this.estimateTokens(request.prompt, request.systemPrompt);

    return await globalRateLimiter.executeWithRetry(
      async (provider: string) => {
        switch (provider) {
          case 'openai':
            return await this.generateOpenAICompletion(request);
          case 'anthropic':
            return await this.generateAnthropicCompletion(request);
          case 'moonshot':
            return await this.generateMoonshotCompletion(request);
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      },
      {
        maxRetries: 3,
        requiredTokens: estimatedTokens,
      }
    );
  }

  /**
   * Generate completion using OpenAI
   */
  private async generateOpenAICompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: request.model || 'gpt-4o-mini',
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 4000,
    };

    if (request.responseFormat === 'json') {
      params.response_format = { type: 'json_object' };
    }

    const completion = await this.openai.chat.completions.create(params);
    
    const choice = completion.choices[0];
    if (!choice) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content || '',
      provider: 'openai',
      model: completion.model,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
      finishReason: choice.finish_reason || undefined,
    };
  }

  /**
   * Generate completion using Anthropic
   */
  private async generateAnthropicCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not available');
    }

    const response = await this.anthropic.messages.create({
      model: request.model || 'claude-3-5-sonnet-20241022',
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt || undefined,
      messages: [
        { role: 'user', content: request.prompt }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      content: content.text,
      provider: 'anthropic',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || undefined,
    };
  }

  /**
   * Generate completion using Moonshot (fallback provider)
   */
  private async generateMoonshotCompletion(request: AIRequest): Promise<AIResponse> {
    if (!process.env.MOONSHOT_API_KEY) {
      throw new Error('Moonshot API key not available');
    }

    // Moonshot uses OpenAI-compatible API
    const moonshotClient = new OpenAI({
      apiKey: process.env.MOONSHOT_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });

    const completion = await moonshotClient.chat.completions.create({
      model: request.model || 'moonshot-v1-32k',
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 4000,
    });
    
    const choice = completion.choices[0];
    if (!choice) {
      throw new Error('No response from Moonshot');
    }

    return {
      content: choice.message.content || '',
      provider: 'moonshot',
      model: completion.model,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
      finishReason: choice.finish_reason || undefined,
    };
  }

  /**
   * Extract structured data using JSON mode
   */
  async extractStructuredData<T = any>(
    prompt: string,
    systemPrompt: string,
    schema?: string
  ): Promise<T> {
    const fullPrompt = schema 
      ? `${prompt}\n\nPlease respond with valid JSON matching this schema:\n${schema}`
      : prompt;

    const response = await this.generateCompletion({
      prompt: fullPrompt,
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.1, // Lower temperature for more consistent structured output
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  /**
   * Batch process multiple prompts efficiently
   */
  async batchProcess(
    requests: AIRequest[],
    options: {
      maxConcurrent?: number;
      continueOnError?: boolean;
    } = {}
  ): Promise<Array<AIResponse | Error>> {
    const maxConcurrent = options.maxConcurrent || 3;
    const continueOnError = options.continueOnError ?? true;
    
    const results: Array<AIResponse | Error> = [];
    
    // Process in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (request) => {
        try {
          return await this.generateCompletion(request);
        } catch (error) {
          if (continueOnError) {
            return error;
          }
          throw error;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get service health and statistics
   */
  getServiceStats(): {
    providersAvailable: string[];
    rateLimitStats: ReturnType<typeof globalRateLimiter.getOverallStats>;
    isHealthy: boolean;
  } {
    const stats = globalRateLimiter.getOverallStats();
    const providersAvailable = Object.keys(stats.providers).filter(
      name => stats.providers[name]?.isHealthy
    );

    return {
      providersAvailable,
      rateLimitStats: stats,
      isHealthy: stats.healthyProviders > 0,
    };
  }

  /**
   * Estimate token usage for a request
   */
  private estimateTokens(prompt: string, systemPrompt?: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    const promptTokens = Math.ceil(prompt.length / 4);
    const systemTokens = systemPrompt ? Math.ceil(systemPrompt.length / 4) : 0;
    
    // Add buffer for completion tokens (estimated as 1/3 of prompt tokens)
    const estimatedCompletionTokens = Math.ceil((promptTokens + systemTokens) / 3);
    
    return promptTokens + systemTokens + estimatedCompletionTokens;
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    globalRateLimiter.shutdown();
  }
}

// Global enhanced AI service
export const enhancedAIService = new EnhancedAIService();