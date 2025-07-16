/**
 * Moonshot AI API Client
 * Implements OpenAI-compatible interface for Moonshot API
 */

interface MoonshotMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MoonshotCompletionRequest {
  model: string;
  messages: MoonshotMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

interface MoonshotCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MoonshotClient {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(options: {
    apiKey: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
  }) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.moonshot.cn/v1';
    this.timeout = options.timeout || 120000; // 2 minutes
    this.maxRetries = options.maxRetries || 2;
  }

  async createCompletion(request: MoonshotCompletionRequest): Promise<MoonshotCompletionResponse> {
    const url = `${this.baseURL}/chat/completions`;
    
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moonshot API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private async makeRequest(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on rate limit or server errors
      if ((response.status === 429 || response.status >= 500) && retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Moonshot API request timed out');
      }
      
      // Retry on network errors
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  // OpenAI-compatible interface for easy integration
  get chat() {
    return {
      completions: {
        create: (params: {
          model: string;
          messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          frequency_penalty?: number;
          presence_penalty?: number;
        }) => this.createCompletion(params)
      }
    };
  }
}

// Initialize Moonshot client if API key is available
export const moonshotClient = process.env.MOONSHOT_API_KEY 
  ? new MoonshotClient({
      apiKey: process.env.MOONSHOT_API_KEY,
      timeout: 120000,
      maxRetries: 2,
    })
  : null;