/**
 * Graceful degradation strategies for document processing
 * Ensures partial success when some components fail
 */

import { DocumentProcessingError } from './error-handler';

export interface DegradationOptions {
  allowPartialSuccess: boolean;
  minimumSuccessRate: number; // 0-1, default 0.5
  fallbackStrategies: {
    aiAnalysis?: boolean;
    embeddings?: boolean;
    advancedChunking?: boolean;
  };
}

export interface ProcessingCapabilities {
  pdfExtraction: boolean;
  aiAnalysis: boolean;
  embeddings: boolean;
  advancedChunking: boolean;
  databaseStorage: boolean;
}

export interface PartialResult<T> {
  success: boolean;
  partial: boolean;
  result?: T;
  errors: DocumentProcessingError[];
  capabilities: ProcessingCapabilities;
  successRate: number;
}

export class GracefulDegradation {
  private capabilities: ProcessingCapabilities = {
    pdfExtraction: true,
    aiAnalysis: true,
    embeddings: true,
    advancedChunking: true,
    databaseStorage: true
  };

  private errors: DocumentProcessingError[] = [];

  constructor(private options: DegradationOptions = {
    allowPartialSuccess: true,
    minimumSuccessRate: 0.5,
    fallbackStrategies: {
      aiAnalysis: true,
      embeddings: true,
      advancedChunking: true
    }
  }) { }

  /**
   * Record a capability failure
   */
  recordFailure(capability: keyof ProcessingCapabilities, error: DocumentProcessingError) {
    this.capabilities[capability] = false;
    this.errors.push(error);

    console.warn(`Capability '${capability}' failed, degrading gracefully:`, error.message);
  }

  /**
   * Get current capabilities status
   */
  getCapabilities(): ProcessingCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if processing should continue
   */
  shouldContinue(): boolean {
    if (!this.options.allowPartialSuccess) {
      return Object.values(this.capabilities).every(cap => cap);
    }

    const successRate = this.getSuccessRate();
    return successRate >= this.options.minimumSuccessRate;
  }

  /**
   * Get current success rate
   */
  getSuccessRate(): number {
    const total = Object.keys(this.capabilities).length;
    const successful = Object.values(this.capabilities).filter(cap => cap).length;
    return successful / total;
  }

  /**
   * Get available fallback for a failed capability
   */
  getFallback(capability: keyof ProcessingCapabilities): string | null {
    if (this.capabilities[capability]) {
      return null; // No fallback needed
    }

    switch (capability) {
      case 'aiAnalysis':
        return this.options.fallbackStrategies?.aiAnalysis
          ? 'pattern-matching'
          : null;

      case 'embeddings':
        return this.options.fallbackStrategies?.embeddings
          ? 'keyword-search'
          : null;

      case 'advancedChunking':
        return this.options.fallbackStrategies?.advancedChunking
          ? 'basic-chunking'
          : null;

      default:
        return null;
    }
  }

  /**
   * Create partial result
   */
  createPartialResult<T>(result?: T): PartialResult<T> {
    const successRate = this.getSuccessRate();
    const success = successRate === 1;
    const partial = !success && successRate >= this.options.minimumSuccessRate;

    return {
      success,
      partial,
      result,
      errors: this.errors,
      capabilities: { ...this.capabilities },
      successRate
    };
  }

  /**
   * Get user-friendly message about degraded capabilities
   */
  getDegradationMessage(): string {
    const failed = Object.entries(this.capabilities)
      .filter(([_, enabled]) => !enabled)
      .map(([capability]) => capability);

    if (failed.length === 0) {
      return 'All processing capabilities available';
    }

    const messages: string[] = [];

    if (failed.includes('aiAnalysis')) {
      messages.push('AI analysis unavailable - using basic pattern matching');
    }
    if (failed.includes('embeddings')) {
      messages.push('Semantic search unavailable - using keyword search');
    }
    if (failed.includes('advancedChunking')) {
      messages.push('Advanced chunking unavailable - using basic text splitting');
    }
    if (failed.includes('pdfExtraction')) {
      messages.push('PDF extraction failed - limited text available');
    }

    return messages.join('. ');
  }
}

/**
 * Fallback implementations for degraded modes
 */
export class FallbackStrategies {
  /**
   * Basic pattern matching when AI is unavailable
   */
  static async basicAnalysis(text: string): Promise<{
    themes: string[];
    keywords: string[];
    insights: string[];
  }> {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    // Basic theme detection
    const themePatterns = {
      'Education': ['education', 'school', 'learning', 'student', 'teacher'],
      'Health': ['health', 'medical', 'wellness', 'care', 'treatment'],
      'Community': ['community', 'social', 'together', 'support', 'group'],
      'Technology': ['technology', 'digital', 'software', 'computer', 'data'],
      'Environment': ['environment', 'climate', 'sustainable', 'green', 'nature']
    };

    const themes: string[] = [];
    for (const [theme, patterns] of Object.entries(themePatterns)) {
      const count = patterns.filter(pattern =>
        text.toLowerCase().includes(pattern)
      ).length;
      if (count >= 2) {
        themes.push(theme);
      }
    }

    // Basic insights
    const insights: string[] = [];
    if (text.length > 1000) {
      insights.push('Document contains substantial content for analysis');
    }
    if (keywords.length > 10) {
      insights.push(`Document focuses on: ${keywords.slice(0, 5).join(', ')}`);
    }
    if (themes.length > 0) {
      insights.push(`Main themes identified: ${themes.join(', ')}`);
    }

    return { themes, keywords, insights };
  }

  /**
   * Basic chunking when advanced chunking fails
   */
  static basicChunking(text: string, chunkSize: number = 1000): Array<{
    text: string;
    startChar: number;
    endChar: number;
  }> {
    const chunks: Array<{ text: string; startChar: number; endChar: number }> = [];

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push({
        text: chunk,
        startChar: i,
        endChar: Math.min(i + chunkSize, text.length)
      });
    }

    return chunks;
  }

  /**
   * Keyword search when embeddings are unavailable
   */
  static keywordSearch(
    query: string,
    documents: Array<{ id: string; text: string }>
  ): Array<{ id: string; score: number }> {
    const queryWords = query.toLowerCase().split(/\s+/);

    return documents
      .map(doc => {
        const docLower = doc.text.toLowerCase();
        const score = queryWords.reduce((total, word) => {
          const occurrences = (docLower.match(new RegExp(word, 'g')) || []).length;
          return total + occurrences;
        }, 0);

        return { id: doc.id, score };
      })
      .filter(result => result.score > 0)
      .sort((a: any, b: any) => b.score - a.score);
  }
}

/**
 * Progressive enhancement strategy
 */
export class ProgressiveEnhancement {
  private stages = [
    { name: 'basic', requirements: ['pdfExtraction'] },
    { name: 'enhanced', requirements: ['pdfExtraction', 'databaseStorage'] },
    { name: 'ai-powered', requirements: ['pdfExtraction', 'databaseStorage', 'aiAnalysis'] },
    { name: 'full', requirements: ['pdfExtraction', 'databaseStorage', 'aiAnalysis', 'embeddings'] }
  ];

  /**
   * Determine the highest processing level available
   */
  getAvailableLevel(capabilities: ProcessingCapabilities): string {
    for (let i = this.stages.length - 1; i >= 0; i--) {
      const stage = this.stages[i];
      if (!stage) continue;

      const meetsRequirements = stage.requirements.every(
        req => capabilities[req as keyof ProcessingCapabilities]
      );

      if (meetsRequirements) {
        return stage.name;
      }
    }

    return 'minimal';
  }

  /**
   * Get processing options for current level
   */
  getProcessingOptions(level: string): {
    useAI: boolean;
    generateEmbeddings: boolean;
    advancedChunking: boolean;
    generateSummary: boolean;
  } {
    switch (level) {
      case 'full':
        return {
          useAI: true,
          generateEmbeddings: true,
          advancedChunking: true,
          generateSummary: true
        };

      case 'ai-powered':
        return {
          useAI: true,
          generateEmbeddings: false,
          advancedChunking: true,
          generateSummary: true
        };

      case 'enhanced':
        return {
          useAI: false,
          generateEmbeddings: false,
          advancedChunking: true,
          generateSummary: false
        };

      case 'basic':
      default:
        return {
          useAI: false,
          generateEmbeddings: false,
          advancedChunking: false,
          generateSummary: false
        };
    }
  }
}