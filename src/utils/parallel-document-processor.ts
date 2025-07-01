/**
 * Parallel document processing implementation
 * Integrates parallel processing with document analysis pipeline
 */

import { ParallelProcessor, BatchProcessor, type ProcessingResult } from './parallel-processor';
import { 
  analyzeDocumentChunk, 
  generateDocumentSummary,
  type AIAnalysisResult 
} from '@/lib/ai-service';
import { EmbeddingsService } from '@/lib/embeddings-service';
import type { DocumentChunk } from './document-chunker';
import type { WorldClassProcessingOptions } from './world-class-document-processor';

export interface ParallelDocumentProcessingOptions extends WorldClassProcessingOptions {
  // Parallel processing settings
  maxConcurrentChunks?: number;
  maxConcurrentDocuments?: number;
  enableBatching?: boolean;
  batchSize?: number;
  
  // Rate limiting
  aiRequestsPerMinute?: number;
  embeddingRequestsPerMinute?: number;
  
  // Progress tracking
  onProgress?: (progress: {
    documentId: string;
    currentChunk: number;
    totalChunks: number;
    stage: 'extraction' | 'chunking' | 'analysis' | 'embedding' | 'storage';
    percentage: number;
  }) => void;
}

export class ParallelDocumentProcessor {
  private chunkProcessor: ParallelProcessor<ChunkProcessingTask, AIAnalysisResult>;
  private embeddingProcessor: ParallelProcessor<EmbeddingTask, void>;
  private batchAnalyzer?: BatchProcessor<ChunkAnalysisRequest, AIAnalysisResult>;
  private embeddingsService: EmbeddingsService;

  constructor(options: ParallelDocumentProcessingOptions = {}) {
    // Initialize processors with appropriate rate limits
    this.chunkProcessor = new ParallelProcessor({
      maxConcurrency: options.maxConcurrentChunks || 5,
      maxRequestsPerMinute: options.aiRequestsPerMinute || 60,
      maxRequestsPerSecond: 2,
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2,
      enableMetrics: true
    });

    this.embeddingProcessor = new ParallelProcessor({
      maxConcurrency: options.maxConcurrentChunks || 10,
      maxRequestsPerMinute: options.embeddingRequestsPerMinute || 300,
      maxRequestsPerSecond: 10,
      maxRetries: 2,
      retryDelay: 1000,
      enableMetrics: true
    });

    // Set up batch processing if enabled
    if (options.enableBatching) {
      this.batchAnalyzer = new BatchProcessor(
        async (requests: ChunkAnalysisRequest[]) => {
          // Batch analyze multiple chunks
          return Promise.all(
            requests.map(req => 
              analyzeDocumentChunk(req.chunk.text, `${req.documentName}${req.context ? `: ${req.context}` : ''}`)
            )
          );
        },
        {
          maxBatchSize: options.batchSize || 5,
          maxBatchDelay: 2000,
          parallelOptions: {
            maxConcurrency: 3,
            maxRequestsPerMinute: options.aiRequestsPerMinute || 60
          }
        }
      );
    }

    this.embeddingsService = new EmbeddingsService();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Process multiple documents in parallel
   */
  async processDocuments(
    documents: Array<{
      buffer: Buffer;
      filename: string;
      originalName: string;
    }>,
    options: ParallelDocumentProcessingOptions = {}
  ): Promise<ProcessingResult<any>[]> {
    const documentProcessor = new ParallelProcessor<{
      buffer: Buffer;
      filename: string;
      originalName: string;
    }, any>({
      maxConcurrency: options.maxConcurrentDocuments || 3,
      maxRequestsPerMinute: 30,
      enableMetrics: true
    });

    const results = await documentProcessor.processBatch(
      documents,
      async (doc) => {
        return this.processSingleDocument(
          doc.buffer,
          doc.filename,
          doc.originalName,
          options
        );
      },
      {
        onProgress: (completed, total) => {
          console.log(`Documents processed: ${completed}/${total}`);
        }
      }
    );

    return results;
  }

  /**
   * Process a single document with parallel chunk analysis
   */
  async processSingleDocument(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: ParallelDocumentProcessingOptions = {}
  ): Promise<any> {
    try {
      // Step 1: Extract and chunk (sequential)
      const { documentId, chunks } = await this.extractAndChunk(
        buffer,
        filename,
        originalName,
        options
      );

      if (options.onProgress) {
        options.onProgress({
          documentId,
          currentChunk: 0,
          totalChunks: chunks.length,
          stage: 'analysis',
          percentage: 25
        });
      }

      // Step 2: Analyze chunks in parallel
      const analysisResults = await this.analyzeChunksInParallel(
        chunks,
        originalName,
        documentId,
        options
      );

      // Step 3: Generate embeddings in parallel
      if (options.generateEmbeddings !== false) {
        await this.generateEmbeddingsInParallel(
          chunks,
          documentId,
          options
        );
      }

      // Step 4: Aggregate results
      const aggregatedResults = this.aggregateResults(analysisResults);

      // Step 5: Generate summary
      const summary = options.generateSummary !== false
        ? await generateDocumentSummary(chunks.map(c => c.text), documentId)
        : undefined;

      if (options.onProgress) {
        options.onProgress({
          documentId,
          currentChunk: chunks.length,
          totalChunks: chunks.length,
          stage: 'storage',
          percentage: 100
        });
      }

      return {
        documentId,
        chunks: chunks.length,
        analysis: aggregatedResults,
        summary,
        metrics: this.getProcessingMetrics()
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Extract text and create chunks
   */
  private async extractAndChunk(
    buffer: Buffer,
    _filename: string,
    _originalName: string,
    _options: ParallelDocumentProcessingOptions
  ): Promise<{ documentId: string; chunks: DocumentChunk[] }> {
    // Use the world-class processor for extraction and chunking
    // This part remains sequential as it's already optimized
    const extractor = new (await import('./pdf-extractor-improved')).ImprovedPDFExtractor(buffer);
    const extractionResult = await extractor.extractText();

    if (!extractionResult.text || extractionResult.text.length < 50) {
      throw new Error('Insufficient text extracted from document');
    }

    // Create adaptive chunks
    const chunker = new (await import('./document-chunker')).DocumentChunker();
    const chunks = await chunker.analyzeAndChunk(extractionResult.text);

    return {
      documentId: `doc-${Date.now()}`,
      chunks: chunks.chunks
    };
  }

  /**
   * Analyze chunks in parallel with rate limiting
   */
  private async analyzeChunksInParallel(
    chunks: DocumentChunk[],
    documentName: string,
    documentId: string,
    options: ParallelDocumentProcessingOptions
  ): Promise<AIAnalysisResult[]> {
    // Prepare chunk processing tasks
    const tasks: ChunkProcessingTask[] = chunks.map((chunk, index) => ({
      chunk,
      documentName,
      context: {
        chunkIndex: index,
        totalChunks: chunks.length,
        previousChunk: chunks[index - 1]?.text,
        nextChunk: chunks[index + 1]?.text
      }
    }));

    // Process chunks with progress tracking
    let processedCount = 0;
    const results = await this.chunkProcessor.processBatch(
      tasks,
      async (task) => {
        const result = options.enableBatching && this.batchAnalyzer
          ? await this.batchAnalyzer.add({
              chunk: task.chunk,
              documentName: task.documentName,
              context: task.context
            })
          : await analyzeDocumentChunk(
              task.chunk.text,
              `${task.documentName}${task.context ? `: ${task.context}` : ''}`
            );

        processedCount++;
        
        if (options.onProgress) {
          options.onProgress({
            documentId,
            currentChunk: processedCount,
            totalChunks: chunks.length,
            stage: 'analysis',
            percentage: 25 + (50 * processedCount / chunks.length)
          });
        }

        return result;
      },
      {
        preserveOrder: true
      }
    );

    // Extract successful results
    return results
      .filter(r => r.success)
      .map(r => r.result!);
  }

  /**
   * Generate embeddings in parallel
   */
  private async generateEmbeddingsInParallel(
    chunks: DocumentChunk[],
    documentId: string,
    options: ParallelDocumentProcessingOptions
  ): Promise<void> {
    const embeddingTasks: EmbeddingTask[] = chunks.map((chunk, index) => ({
      documentId,
      chunkId: `chunk-${index}`,
      text: chunk.text,
      metadata: chunk.metadata
    }));

    let embeddedCount = 0;
    
    await this.embeddingProcessor.processBatch(
      embeddingTasks,
      async (task) => {
        await this.embeddingsService.generateEmbedding(task.text);

        embeddedCount++;
        
        if (options.onProgress) {
          options.onProgress({
            documentId,
            currentChunk: embeddedCount,
            totalChunks: chunks.length,
            stage: 'embedding',
            percentage: 75 + (25 * embeddedCount / chunks.length)
          });
        }
      }
    );
  }

  /**
   * Process documents as a stream for memory efficiency
   */
  async *processDocumentStream(
    documents: Array<{
      buffer: Buffer;
      filename: string;
      originalName: string;
    }>,
    options: ParallelDocumentProcessingOptions = {}
  ): AsyncGenerator<ProcessingResult<any>, void, unknown> {
    const processor = new ParallelProcessor<{
      buffer: Buffer;
      filename: string;
      originalName: string;
    }, any>({
      maxConcurrency: options.maxConcurrentDocuments || 2,
      maxRequestsPerMinute: 30
    });

    for await (const result of processor.processStream(
      documents,
      async (doc) => this.processSingleDocument(
        doc.buffer,
        doc.filename,
        doc.originalName,
        options
      )
    )) {
      yield result;
    }
  }

  /**
   * Aggregate analysis results from all chunks
   */
  private aggregateResults(results: AIAnalysisResult[]): any {
    const aggregated = {
      themes: [] as any[],
      keywords: [] as any[],
      quotes: [] as any[],
      insights: [] as any[]
    };

    // Merge all results
    for (const result of results) {
      if (result.themes) aggregated.themes.push(...result.themes);
      if (result.keywords) aggregated.keywords.push(...result.keywords);
      if (result.quotes) aggregated.quotes.push(...result.quotes);
      if (result.insights) aggregated.insights.push(...result.insights);
    }

    // Deduplicate and rank
    aggregated.themes = this.deduplicateAndRank(aggregated.themes, 'name');
    aggregated.keywords = this.deduplicateAndRank(aggregated.keywords, 'word');

    return aggregated;
  }

  /**
   * Deduplicate and rank items by frequency
   */
  private deduplicateAndRank(items: any[], key: string): any[] {
    const itemMap = new Map<string, { item: any; count: number }>();

    for (const item of items) {
      const itemKey = typeof item === 'string' ? item : item[key];
      if (itemMap.has(itemKey)) {
        itemMap.get(itemKey)!.count++;
      } else {
        itemMap.set(itemKey, { item, count: 1 });
      }
    }

    return Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .map(({ item, count }) => {
        if (typeof item === 'string') {
          return { [key]: item, frequency: count };
        }
        return { ...item, frequency: count };
      });
  }

  /**
   * Get processing metrics
   */
  getProcessingMetrics() {
    return {
      chunkProcessing: this.chunkProcessor.getMetrics(),
      embeddingProcessing: this.embeddingProcessor.getMetrics()
    };
  }

  /**
   * Set up event listeners for monitoring
   */
  private setupEventListeners() {
    this.chunkProcessor.on('metrics', (metrics) => {
      console.log('Chunk processing metrics:', metrics);
    });

    this.embeddingProcessor.on('metrics', (metrics) => {
      console.log('Embedding processing metrics:', metrics);
    });

    this.chunkProcessor.on('error', (error) => {
      console.error('Chunk processing error:', error);
    });

    this.embeddingProcessor.on('error', (error) => {
      console.error('Embedding processing error:', error);
    });
  }

  /**
   * Shutdown all processors
   */
  async shutdown() {
    await Promise.all([
      this.chunkProcessor.shutdown(),
      this.embeddingProcessor.shutdown()
    ]);
  }
}

// Type definitions
interface ChunkProcessingTask {
  chunk: DocumentChunk;
  documentName: string;
  context: any;
}

interface ChunkAnalysisRequest {
  chunk: DocumentChunk;
  documentName: string;
  context: any;
}

interface EmbeddingTask {
  documentId: string;
  chunkId: string;
  text: string;
  metadata?: any;
}