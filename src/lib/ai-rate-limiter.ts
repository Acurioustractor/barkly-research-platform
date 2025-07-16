import { EventEmitter } from 'events';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute?: number;
  tokensPerHour?: number;
  concurrent?: number;
  retryDelays: number[]; // Exponential backoff delays in ms
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  rateLimit: RateLimitConfig;
  healthCheck: () => Promise<boolean>;
  lastHealthCheck?: Date;
  isHealthy?: boolean;
  failureCount: number;
  lastFailure?: Date;
}

interface RequestRecord {
  timestamp: number;
  tokens?: number;
}

export class AIRateLimiter extends EventEmitter {
  private providers: Map<string, ProviderConfig> = new Map();
  private requestHistory: Map<string, RequestRecord[]> = new Map();
  private activeRequests: Map<string, Set<string>> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHealthChecks();
  }

  /**
   * Register an AI provider with rate limiting configuration
   */
  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, {
      ...config,
      isHealthy: true,
      failureCount: 0,
    });
    
    if (!this.requestHistory.has(config.name)) {
      this.requestHistory.set(config.name, []);
    }
    
    if (!this.activeRequests.has(config.name)) {
      this.activeRequests.set(config.name, new Set());
    }
    
    this.emit('provider:registered', config);
  }

  /**
   * Get the best available provider for making a request
   */
  async selectProvider(
    excludeProviders: string[] = [],
    requiredTokens?: number
  ): Promise<string | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => 
        provider.enabled && 
        provider.isHealthy &&
        !excludeProviders.includes(provider.name)
      )
      .sort((a, b) => a.priority - b.priority);

    for (const provider of availableProviders) {
      if (await this.canMakeRequest(provider.name, requiredTokens)) {
        return provider.name;
      }
    }

    return null;
  }

  /**
   * Check if a provider can handle a request within rate limits
   */
  async canMakeRequest(
    providerName: string,
    requiredTokens?: number
  ): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.enabled || !provider.isHealthy) {
      return false;
    }

    const history = this.requestHistory.get(providerName) || [];
    const now = Date.now();
    const activeCount = this.activeRequests.get(providerName)?.size || 0;

    // Check concurrent requests limit
    if (provider.rateLimit.concurrent && activeCount >= provider.rateLimit.concurrent) {
      return false;
    }

    // Clean old records and check rate limits
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;

    const recentHistory = history.filter(record => now - record.timestamp < oneDay);
    this.requestHistory.set(providerName, recentHistory);

    const lastMinute = recentHistory.filter(r => now - r.timestamp < oneMinute);
    const lastHour = recentHistory.filter(r => now - r.timestamp < oneHour);
    const lastDay = recentHistory;

    // Check request count limits
    if (lastMinute.length >= provider.rateLimit.requestsPerMinute) return false;
    if (lastHour.length >= provider.rateLimit.requestsPerHour) return false;
    if (lastDay.length >= provider.rateLimit.requestsPerDay) return false;

    // Check token limits if specified
    if (requiredTokens && provider.rateLimit.tokensPerMinute) {
      const tokensLastMinute = lastMinute.reduce((sum, r) => sum + (r.tokens || 0), 0);
      if (tokensLastMinute + requiredTokens > provider.rateLimit.tokensPerMinute) {
        return false;
      }
    }

    if (requiredTokens && provider.rateLimit.tokensPerHour) {
      const tokensLastHour = lastHour.reduce((sum, r) => sum + (r.tokens || 0), 0);
      if (tokensLastHour + requiredTokens > provider.rateLimit.tokensPerHour) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record a request for rate limiting tracking
   */
  recordRequest(
    providerName: string,
    requestId: string,
    tokens?: number
  ): void {
    const history = this.requestHistory.get(providerName) || [];
    history.push({
      timestamp: Date.now(),
      tokens,
    });
    this.requestHistory.set(providerName, history);

    const activeRequests = this.activeRequests.get(providerName) || new Set();
    activeRequests.add(requestId);
    this.activeRequests.set(providerName, activeRequests);

    this.emit('request:started', { providerName, requestId, tokens });
  }

  /**
   * Mark a request as completed
   */
  completeRequest(providerName: string, requestId: string): void {
    const activeRequests = this.activeRequests.get(providerName);
    if (activeRequests) {
      activeRequests.delete(requestId);
    }

    this.emit('request:completed', { providerName, requestId });
  }

  /**
   * Record a request failure for provider health tracking
   */
  recordFailure(providerName: string, error: any): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.failureCount++;
      provider.lastFailure = new Date();
      
      // Mark as unhealthy if too many failures
      if (provider.failureCount >= 5) {
        provider.isHealthy = false;
        this.emit('provider:unhealthy', { providerName, error });
      }
    }
  }

  /**
   * Get rate limiting statistics for a provider
   */
  getProviderStats(providerName: string): {
    requestsLastMinute: number;
    requestsLastHour: number;
    requestsLastDay: number;
    tokensLastMinute: number;
    tokensLastHour: number;
    activeRequests: number;
    isHealthy: boolean;
    failureCount: number;
  } | null {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    const history = this.requestHistory.get(providerName) || [];
    const now = Date.now();
    
    const lastMinute = history.filter(r => now - r.timestamp < 60 * 1000);
    const lastHour = history.filter(r => now - r.timestamp < 60 * 60 * 1000);
    const lastDay = history.filter(r => now - r.timestamp < 24 * 60 * 60 * 1000);

    return {
      requestsLastMinute: lastMinute.length,
      requestsLastHour: lastHour.length,
      requestsLastDay: lastDay.length,
      tokensLastMinute: lastMinute.reduce((sum, r) => sum + (r.tokens || 0), 0),
      tokensLastHour: lastHour.reduce((sum, r) => sum + (r.tokens || 0), 0),
      activeRequests: this.activeRequests.get(providerName)?.size || 0,
      isHealthy: provider.isHealthy,
      failureCount: provider.failureCount,
    };
  }

  /**
   * Get overall rate limiting status
   */
  getOverallStats(): {
    totalProviders: number;
    healthyProviders: number;
    totalActiveRequests: number;
    providers: Record<string, ReturnType<typeof this.getProviderStats>>;
  } {
    const providers: Record<string, ReturnType<typeof this.getProviderStats>> = {};
    let healthyCount = 0;
    let totalActive = 0;

    for (const [name, provider] of this.providers) {
      const stats = this.getProviderStats(name);
      providers[name] = stats;
      
      if (provider.isHealthy) healthyCount++;
      if (stats) totalActive += stats.activeRequests;
    }

    return {
      totalProviders: this.providers.size,
      healthyProviders: healthyCount,
      totalActiveRequests: totalActive,
      providers,
    };
  }

  /**
   * Execute a request with automatic provider selection and retry logic
   */
  async executeWithRetry<T>(
    requestFn: (provider: string) => Promise<T>,
    options: {
      maxRetries?: number;
      requiredTokens?: number;
      excludeProviders?: string[];
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const excludeProviders = options.excludeProviders || [];
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const provider = await this.selectProvider(excludeProviders, options.requiredTokens);
      
      if (!provider) {
        // Wait and try again if no providers available
        await this.waitForAvailableProvider(attempt);
        continue;
      }

      const requestId = this.generateRequestId();
      
      try {
        this.recordRequest(provider, requestId, options.requiredTokens);
        
        const result = await requestFn(provider);
        
        this.completeRequest(provider, requestId);
        
        // Reset failure count on success
        const providerConfig = this.providers.get(provider);
        if (providerConfig) {
          providerConfig.failureCount = 0;
        }
        
        return result;
      } catch (error) {
        this.completeRequest(provider, requestId);
        this.recordFailure(provider, error);
        
        lastError = error;
        excludeProviders.push(provider);
        
        // Wait before retry
        const delay = this.getRetryDelay(provider, attempt);
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`All providers failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Start periodic health checks for all providers
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const isHealthy = await provider.healthCheck();
          
          if (!isHealthy && provider.isHealthy) {
            provider.isHealthy = false;
            this.emit('provider:unhealthy', { providerName: name });
          } else if (isHealthy && !provider.isHealthy) {
            provider.isHealthy = true;
            provider.failureCount = 0;
            this.emit('provider:healthy', { providerName: name });
          }
          
          provider.lastHealthCheck = new Date();
        } catch (error) {
          if (provider.isHealthy) {
            provider.isHealthy = false;
            this.emit('provider:unhealthy', { providerName: name, error });
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Wait for an available provider with exponential backoff
   */
  private async waitForAvailableProvider(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get retry delay for a specific provider and attempt
   */
  private getRetryDelay(providerName: string, attempt: number): number {
    const provider = this.providers.get(providerName);
    if (!provider) return 0;

    const delays = provider.rateLimit.retryDelays;
    const delayIndex = Math.min(attempt, delays.length - 1);
    return delays[delayIndex] || 0;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown the rate limiter
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new AIRateLimiter();