/**
 * Optimized Chunking Service
 * Provides intelligent document chunking with performance optimization
 */

import { DocumentChunker, type DocumentChunk } from '@/utils/document-chunker';
import { AdaptiveChunker } from '@/utils/adaptive-chunker';

export interface ChunkingOptions {
  processingType: 'quick' | 'standard' | 'deep' | 'world-class';
  documentType?: 'academic' | 'conversational' | 'technical' | 'general';
  prioritizePerformance?: boolean;
  enableCaching?: boolean;
  maxChunkSize?: number;
  targetEmbeddingSize?: number;
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  metadata: {
    strategy: string;
    processingTime: number;
    originalLength: number;
    chunksCreated: number;
    averageChunkSize: number;
    recommendedForEmbedding: boolean;
    qualityScore: number;
  };
}

export interface ChunkingPerformanceStats {
  totalDocuments: number;
  averageProcessingTime: number;
  strategyUsage: Record<string, number>;
  performanceByType: Record<string, number>;
}

export class OptimizedChunkingService {
  private chunker: DocumentChunker;
  private cache: Map<string, ChunkingResult> = new Map();
  private performanceStats: ChunkingPerformanceStats = {
    totalDocuments: 0,
    averageProcessingTime: 0,
    strategyUsage: {},
    performanceByType: {}
  };
  
  constructor() {
    this.chunker = new DocumentChunker();
  }
  
  /**
   * Chunk document with optimized strategy selection
   */
  async chunkDocument(
    text: string,
    options: ChunkingOptions
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    
    // Check cache if enabled
    if (options.enableCaching) {
      const cacheKey = this.generateCacheKey(text, options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Select optimal chunking strategy
    const strategy = this.selectOptimalStrategy(text, options);
    
    // Perform chunking
    const chunks = await this.executeChunking(text, strategy, options);
    
    // Calculate metadata
    const processingTime = Date.now() - startTime;
    const metadata = this.calculateMetadata(chunks, processingTime, strategy, text);
    
    const result: ChunkingResult = {
      chunks,
      metadata
    };
    
    // Update performance stats
    this.updatePerformanceStats(processingTime, strategy, options.processingType);
    
    // Cache result if enabled
    if (options.enableCaching) {
      const cacheKey = this.generateCacheKey(text, options);
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Select optimal chunking strategy based on document and processing requirements
   */
  private selectOptimalStrategy(text: string, options: ChunkingOptions): string {
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;
    
    // Quick processing - prioritize speed
    if (options.processingType === 'quick') {
      return wordCount < 1000 ? 'simple' : 'sliding';
    }
    
    // World-class processing - prioritize quality
    if (options.processingType === 'world-class') {
      return 'hierarchical';
    }
    
    // Analyze document characteristics for optimal strategy
    const hasHeaders = /^#{1,6}\s+.+$/m.test(text) || /^[A-Z][A-Z\s]+$/m.test(text);
    const hasLists = /^[\s]*[-*•]\s+/m.test(text) || /^[\s]*\d+\.\s+/m.test(text);
    const hasQuotes = /"[^"]{20,}"/g.test(text);
    const avgSentenceLength = this.calculateAverageSentenceLength(text);
    
    // Document type specific strategies
    if (options.documentType === 'academic' && hasHeaders) {
      return 'structural';
    }
    
    if (options.documentType === 'conversational' && hasQuotes) {
      return 'semantic';
    }
    
    if (options.documentType === 'technical' && hasLists) {
      return 'hybrid';
    }
    
    // Performance-based selection
    if (options.prioritizePerformance) {
      if (textLength < 5000) return 'simple';
      if (textLength < 20000) return 'sliding';
      return 'adaptive';
    }
    
    // Default strategy based on document characteristics
    if (hasHeaders && avgSentenceLength > 15) return 'structural';
    if (hasQuotes && avgSentenceLength < 15) return 'semantic';
    if (textLength > 50000) return 'hierarchical';
    
    return 'adaptive';
  }
  
  /**
   * Execute chunking with selected strategy
   */
  private async executeChunking(
    text: string,
    strategy: string,
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    switch (strategy) {
      case 'simple':
        return this.chunker.chunkDocument(text);
        
      case 'sliding':
        return this.chunker.createSlidingWindowChunks(text, 800, 400);
        
      case 'semantic':
        return this.chunker.createSemanticChunks(text);
        
      case 'structural':
        return this.chunker.createSemanticChunks(text);
        
      case 'adaptive':
        return this.chunker.chunkDocumentAdaptive(text, options.documentType);
        
      case 'hierarchical':
        const hierarchical = await this.chunker.createHierarchicalChunks(text);
        return this.selectOptimalHierarchicalLevel(hierarchical, options);
        
      case 'hybrid':
        const analysis = await this.chunker.analyzeAndChunk(text);
        return analysis.chunks;
        
      case 'embedding-optimized':
        return this.chunker.createEmbeddingOptimizedChunks(text);
        
      default:
        return this.chunker.chunkDocument(text);
    }
  }
  
  /**
   * Select optimal hierarchical level based on processing requirements
   */
  private selectOptimalHierarchicalLevel(
    hierarchical: {
      coarse: DocumentChunk[];
      fine: DocumentChunk[];
      sentences: DocumentChunk[];
    },
    options: ChunkingOptions
  ): DocumentChunk[] {
    switch (options.processingType) {
      case 'quick':
        return hierarchical.coarse;
      case 'standard':
        return hierarchical.fine;
      case 'deep':
        return hierarchical.fine;
      case 'world-class':
        return hierarchical.fine; // Use fine for balanced performance
      default:
        return hierarchical.fine;
    }
  }
  
  /**
   * Calculate chunking metadata
   */
  private calculateMetadata(
    chunks: DocumentChunk[],
    processingTime: number,
    strategy: string,
    originalText: string
  ): ChunkingResult['metadata'] {
    const totalWords = chunks.reduce((sum, chunk) => sum + (chunk.wordCount || 0), 0);
    const averageChunkSize = chunks.length > 0 ? totalWords / chunks.length : 0;
    
    // Calculate quality score based on chunk characteristics
    const qualityScore = this.calculateChunkQualityScore(chunks, originalText);
    
    // Determine if chunks are suitable for embedding
    const recommendedForEmbedding = averageChunkSize >= 50 && averageChunkSize <= 500;
    
    return {
      strategy,
      processingTime,
      originalLength: originalText.length,
      chunksCreated: chunks.length,
      averageChunkSize,
      recommendedForEmbedding,
      qualityScore
    };
  }
  
  /**
   * Calculate quality score for chunks
   */
  private calculateChunkQualityScore(chunks: DocumentChunk[], originalText: string): number {
    if (chunks.length === 0) return 0;
    
    let score = 0.5; // Base score
    
    // Size consistency
    const chunkSizes = chunks.map(chunk => chunk.wordCount || 0);
    const avgSize = chunkSizes.reduce((sum, size) => sum + size, 0) / chunkSizes.length;
    const sizeVariance = chunkSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / chunkSizes.length;
    const sizeConsistency = Math.max(0, 1 - (sizeVariance / (avgSize * avgSize)));
    
    score += sizeConsistency * 0.2;
    
    // Content preservation
    const totalChunkLength = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
    const contentPreservation = totalChunkLength / originalText.length;
    score += Math.min(contentPreservation, 1) * 0.2;
    
    // Boundary quality (check for sentence/paragraph boundaries)
    const boundaryQuality = this.calculateBoundaryQuality(chunks);
    score += boundaryQuality * 0.1;
    
    return Math.min(1, score);
  }
  
  /**
   * Calculate boundary quality score
   */
  private calculateBoundaryQuality(chunks: DocumentChunk[]): number {
    let properBoundaries = 0;
    
    for (const chunk of chunks) {
      const text = chunk.text.trim();
      
      // Check if chunk starts with proper sentence beginning
      if (text.match(/^[A-Z"]/) || text.match(/^[0-9]/)) {
        properBoundaries += 0.5;
      }
      
      // Check if chunk ends with proper sentence ending
      if (text.match(/[.!?]$/) || text.match(/\n$/)) {
        properBoundaries += 0.5;
      }
    }
    
    return chunks.length > 0 ? properBoundaries / chunks.length : 0;
  }
  
  /**
   * Update performance statistics
   */
  private updatePerformanceStats(
    processingTime: number,
    strategy: string,
    processingType: string
  ): void {
    this.performanceStats.totalDocuments++;
    
    // Update average processing time
    const currentAvg = this.performanceStats.averageProcessingTime;
    const newAvg = (currentAvg * (this.performanceStats.totalDocuments - 1) + processingTime) / this.performanceStats.totalDocuments;
    this.performanceStats.averageProcessingTime = newAvg;
    
    // Update strategy usage
    this.performanceStats.strategyUsage[strategy] = (this.performanceStats.strategyUsage[strategy] || 0) + 1;
    
    // Update performance by type
    const currentTypeAvg = this.performanceStats.performanceByType[processingType] || 0;
    const typeCount = Object.keys(this.performanceStats.performanceByType).length;
    this.performanceStats.performanceByType[processingType] = 
      (currentTypeAvg * (typeCount - 1) + processingTime) / typeCount;
  }
  
  /**
   * Calculate average sentence length
   */
  private calculateAverageSentenceLength(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length;
    }, 0);
    
    return totalWords / sentences.length;
  }
  
  /**
   * Generate cache key for chunking result
   */
  private generateCacheKey(text: string, options: ChunkingOptions): string {
    const textHash = this.simpleHash(text);
    const optionsHash = this.simpleHash(JSON.stringify(options));
    return `${textHash}-${optionsHash}`;
  }
  
  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(): ChunkingPerformanceStats {
    return { ...this.performanceStats };
  }
  
  /**
   * Reset performance statistics
   */
  resetPerformanceStats(): void {
    this.performanceStats = {
      totalDocuments: 0,
      averageProcessingTime: 0,
      strategyUsage: {},
      performanceByType: {}
    };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: this.estimateCacheMemoryUsage()
    };
  }
  
  /**
   * Estimate cache memory usage
   */
  private estimateCacheMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, value] of this.cache) {
      totalSize += key.length * 2; // Rough UTF-16 size
      totalSize += JSON.stringify(value).length * 2;
    }
    
    return totalSize;
  }
  
  /**
   * Optimize chunks for specific use case
   */
  async optimizeChunksForUseCase(
    chunks: DocumentChunk[],
    useCase: 'embedding' | 'analysis' | 'search' | 'summarization'
  ): Promise<DocumentChunk[]> {
    switch (useCase) {
      case 'embedding':
        return this.optimizeForEmbedding(chunks);
      case 'analysis':
        return this.optimizeForAnalysis(chunks);
      case 'search':
        return this.optimizeForSearch(chunks);
      case 'summarization':
        return this.optimizeForSummarization(chunks);
      default:
        return chunks;
    }
  }
  
  /**
   * Optimize chunks for embedding generation
   */
  private optimizeForEmbedding(chunks: DocumentChunk[]): DocumentChunk[] {
    const targetSize = 250; // Optimal for most embedding models
    const optimized: DocumentChunk[] = [];
    
    let currentChunk: DocumentChunk | null = null;
    let currentSize = 0;
    
    for (const chunk of chunks) {
      const chunkSize = chunk.wordCount || 0;
      
      if (currentSize + chunkSize <= targetSize * 1.5) {
        // Merge with current chunk
        if (currentChunk) {
          currentChunk.text += ' ' + chunk.text;
          currentChunk.wordCount = (currentChunk.wordCount || 0) + chunkSize;
          currentChunk.endChar = chunk.endChar;
          currentSize += chunkSize;
        } else {
          currentChunk = { ...chunk };
          currentSize = chunkSize;
        }
      } else {
        // Save current chunk and start new one
        if (currentChunk) {
          optimized.push(currentChunk);
        }
        currentChunk = { ...chunk };
        currentSize = chunkSize;
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      optimized.push(currentChunk);
    }
    
    return optimized;
  }
  
  /**
   * Optimize chunks for analysis
   */
  private optimizeForAnalysis(chunks: DocumentChunk[]): DocumentChunk[] {
    // For analysis, we want larger chunks with more context
    return chunks.filter(chunk => (chunk.wordCount || 0) >= 100);
  }
  
  /**
   * Optimize chunks for search
   */
  private optimizeForSearch(chunks: DocumentChunk[]): DocumentChunk[] {
    // For search, we want smaller, more focused chunks
    return chunks.filter(chunk => (chunk.wordCount || 0) <= 200);
  }
  
  /**
   * Optimize chunks for summarization
   */
  private optimizeForSummarization(chunks: DocumentChunk[]): DocumentChunk[] {
    // For summarization, we want to preserve document structure
    return chunks.filter(chunk => 
      chunk.metadata?.hasHeaders || 
      (chunk.wordCount || 0) >= 50
    );
  }
  
  /**
   * Recommend optimal chunking strategy for document
   */
  async recommendStrategy(text: string): Promise<{
    strategy: string;
    reasoning: string;
    expectedPerformance: {
      processingTime: number;
      qualityScore: number;
      suitableFor: string[];
    };
  }> {
    const analysis = await this.chunker.analyzeAndChunk(text);
    
    const reasoning = this.generateStrategyReasoning(analysis.analysis);
    const expectedPerformance = this.estimatePerformance(analysis.recommendedStrategy, text.length);
    
    return {
      strategy: analysis.recommendedStrategy,
      reasoning,
      expectedPerformance
    };
  }
  
  /**
   * Generate reasoning for strategy recommendation
   */
  private generateStrategyReasoning(analysis: any): string {
    const reasons: string[] = [];
    
    if (analysis.documentType === 'academic') {
      reasons.push('Document appears to be academic with structured content');
    }
    
    if (analysis.hasStructure) {
      reasons.push('Document has clear structural elements (headers, lists)');
    }
    
    if (analysis.averageSentenceLength > 20) {
      reasons.push('Complex sentences suggest need for careful boundary detection');
    }
    
    if (analysis.contentDensity > 0.7) {
      reasons.push('High content density benefits from semantic chunking');
    }
    
    return reasons.join('. ') + '.';
  }
  
  /**
   * Estimate performance for strategy
   */
  private estimatePerformance(strategy: string, textLength: number): {
    processingTime: number;
    qualityScore: number;
    suitableFor: string[];
  } {
    const baseTime = Math.max(100, textLength / 1000); // 1ms per 1000 chars minimum
    
    const strategyMultipliers = {
      'simple': { time: 1.0, quality: 0.6, uses: ['quick', 'basic'] },
      'sliding': { time: 1.2, quality: 0.7, uses: ['embedding', 'search'] },
      'semantic': { time: 1.5, quality: 0.8, uses: ['analysis', 'summarization'] },
      'structural': { time: 1.3, quality: 0.85, uses: ['analysis', 'academic'] },
      'adaptive': { time: 1.8, quality: 0.9, uses: ['analysis', 'embedding'] },
      'hierarchical': { time: 2.5, quality: 0.95, uses: ['deep-analysis', 'research'] },
      'hybrid': { time: 2.0, quality: 0.9, uses: ['comprehensive', 'multi-purpose'] }
    };
    
    const config = strategyMultipliers[strategy as keyof typeof strategyMultipliers] || 
                  { time: 1.5, quality: 0.8, uses: ['general'] };
    
    return {
      processingTime: Math.round(baseTime * config.time),
      qualityScore: config.quality,
      suitableFor: config.uses
    };
  }
}