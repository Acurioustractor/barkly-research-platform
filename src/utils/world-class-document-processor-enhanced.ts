/**
 * Enhanced World-Class Document Processor with comprehensive error handling
 * Implements graceful degradation and progressive enhancement
 */

import { prisma } from '@/lib/database-safe';
import { DocumentChunker, type DocumentChunk } from './document-chunker';
import { ImprovedPDFExtractor } from './pdf-extractor-improved';
// AI service imports commented out - not yet implemented
// import { 
//   performDeepAnalysis,
//   performCrossChunkAnalysis,
//   generateComprehensiveSummary,
//   type DeepAnalysisResult,
//   type CrossChunkAnalysisResult
// } from '@/lib/ai/world-class-ai-service';
import { EmbeddingsService } from '@/lib/ai/embeddings-service';
// Define ProcessingStatus locally as Prisma enum exports are problematic
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
import {
  ErrorHandler,
  ErrorType,
  DocumentProcessingError,
  RetryHandler,
  CircuitBreaker
} from './error-handler';
import {
  GracefulDegradation,
  FallbackStrategies,
  ProgressiveEnhancement,
  // type ProcessingCapabilities 
} from './graceful-degradation';

export interface WorldClassProcessingOptions {
  source?: string;
  category?: string;
  tags?: string[];
  // Enhanced chunking options
  chunkingStrategy?: 'granular' | 'semantic' | 'hybrid';
  minChunkSize?: number;
  maxChunkSize?: number;
  overlapPercentage?: number;
  // Analysis options
  analysisDepth?: 'standard' | 'deep' | 'exhaustive';
  multiPassAnalysis?: boolean;
  crossChunkAnalysis?: boolean;
  // Feature flags
  generateSummary?: boolean;
  generateEmbeddings?: boolean;
  extractEntities?: boolean;
  identifyContradictions?: boolean;
  mapRelationships?: boolean;
  detectSentiment?: boolean;
  // Output options
  minThemesPerDocument?: number;
  minQuotesPerDocument?: number;
  minInsightsPerDocument?: number;
  // Error handling
  allowPartialSuccess?: boolean;
  retryFailedOperations?: boolean;
}

export interface WorldClassProcessingResult {
  documentId: string;
  status: ProcessingStatus;
  chunks: number;
  themes: number;
  quotes: number;
  insights: number;
  keywords: number;
  entities: number;
  relationships: number;
  contradictions: number;
  sentimentScore?: number;
  summary?: string;
  executiveSummary?: string;
  keyTakeaways?: string[];
  errorMessage?: string;
  warnings?: string[];
  degradedCapabilities?: string[];
  processingLevel?: string;
}

export class EnhancedWorldClassDocumentProcessor {
  private chunker: DocumentChunker;
  private embeddingsService: EmbeddingsService;
  private circuitBreaker: CircuitBreaker;
  private progressiveEnhancement: ProgressiveEnhancement;

  constructor() {
    this.chunker = new DocumentChunker({
      maxChunkSize: 400,
      overlapSize: 100,
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 50
    });
    this.embeddingsService = new EmbeddingsService();
    this.circuitBreaker = new CircuitBreaker();
    this.progressiveEnhancement = new ProgressiveEnhancement();
  }

  async processAndStoreDocument(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: WorldClassProcessingOptions = {}
  ): Promise<WorldClassProcessingResult> {
    console.log('=== Starting enhanced world-class document processing ===', {
      filename,
      originalName,
      bufferSize: buffer.length,
      options
    });

    const degradation = new GracefulDegradation({
      allowPartialSuccess: options.allowPartialSuccess ?? true,
      minimumSuccessRate: 0.5,
      fallbackStrategies: {
        aiAnalysis: true,
        embeddings: true,
        advancedChunking: true
      }
    });

    let documentId: string | undefined;
    const warnings: string[] = [];
    let processingLevel = 'full';

    try {
      // Step 1: Database initialization with error handling
      const dbResult = await this.initializeDatabase(
        buffer, filename, originalName, options, degradation
      );

      if (!dbResult.success) {
        throw new DocumentProcessingError({
          type: ErrorType.DATABASE,
          message: 'Failed to initialize database',
          recoverable: false,
          retryable: false
        });
      }

      documentId = dbResult.documentId!;

      // Step 2: PDF extraction with comprehensive error handling
      const extractionResult = await this.extractPDFWithErrorHandling(
        buffer, degradation, options
      );

      if (!extractionResult.success) {
        throw new DocumentProcessingError({
          type: ErrorType.PDF_EXTRACTION,
          message: 'PDF extraction failed completely',
          recoverable: false,
          retryable: false
        });
      }

      const { text, metadata, extractionWarnings } = extractionResult;
      warnings.push(...extractionWarnings);

      // Step 3: Intelligent chunking with fallback
      const chunks = await this.createChunksWithFallback(
        text, options, degradation
      );

      // Step 4: Store chunks in database
      const storedChunks = await this.storeChunksWithRetry(
        documentId, chunks, degradation
      );

      // Step 5: Perform analysis with graceful degradation
      const analysisResult = await this.performAnalysisWithDegradation(
        chunks, originalName, options, degradation
      );

      // Step 6: Store analysis results
      await this.storeAnalysisResults(
        documentId, analysisResult
      );

      // Step 7: Generate embeddings if available
      if (options.generateEmbeddings !== false) {
        await this.generateEmbeddingsWithFallback(
          documentId, storedChunks, degradation
        );
      }

      // Step 8: Update document status
      processingLevel = this.progressiveEnhancement.getAvailableLevel(
        degradation.getCapabilities() as any
      );

      const finalStatus = degradation.shouldContinue() ? 'COMPLETED' : 'FAILED';

      await prisma?.document.update({
        where: { id: documentId },
        data: {
          status: finalStatus,
          fullText: text.substring(0, 50000), // Limit stored text
          pageCount: metadata.pageCount,
          wordCount: metadata.wordCount,
          processedAt: new Date()
        }
      });

      return {
        documentId,
        status: finalStatus,
        chunks: storedChunks.length,
        themes: analysisResult.themes.length,
        quotes: analysisResult.quotes.length,
        insights: analysisResult.insights.length,
        keywords: analysisResult.keywords.length,
        entities: analysisResult.entities?.length || 0,
        relationships: analysisResult.relationships?.length || 0,
        contradictions: analysisResult.contradictions?.length || 0,
        sentimentScore: analysisResult.sentimentScore,
        summary: analysisResult.summary,
        executiveSummary: analysisResult.executiveSummary,
        keyTakeaways: analysisResult.keyTakeaways,
        warnings,
        degradedCapabilities: Object.entries(degradation.getCapabilities())
          .filter(([, enabled]) => !enabled)
          .map(([cap]) => cap),
        processingLevel
      };

    } catch (error) {
      console.error('Document processing error:', error);

      // Update document status to failed
      if (documentId && prisma) {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        }).catch(console.error);
      }

      const partialResult = degradation.createPartialResult<WorldClassProcessingResult>();

      if (partialResult.partial && options.allowPartialSuccess) {
        return {
          documentId: documentId || '',
          status: 'FAILED' as ProcessingStatus,
          chunks: 0,
          themes: 0,
          quotes: 0,
          insights: 0,
          keywords: 0,
          entities: 0,
          relationships: 0,
          contradictions: 0,
          errorMessage: degradation.getDegradationMessage(),
          warnings,
          degradedCapabilities: Object.entries(degradation.getCapabilities())
            .filter(([, enabled]) => !enabled)
            .map(([cap]) => cap),
          processingLevel: 'minimal'
        };
      }

      throw error;
    }
  }

  private async initializeDatabase(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: WorldClassProcessingOptions,
    degradation: GracefulDegradation
  ): Promise<{ success: boolean; documentId?: string }> {
    try {
      if (!prisma) {
        throw new Error('Database not available');
      }

      const document = await RetryHandler.withRetry(
        async () => prisma!.document.create({
          data: {
            filename,
            originalName,
            mimeType: 'application/pdf',
            size: buffer.length,
            source: options.source,
            category: options.category,
            tags: options.tags ? JSON.stringify(options.tags) : undefined,
            status: 'PROCESSING'
          }
        }),
        { maxRetries: 3, initialDelay: 1000 }
      );

      return { success: true, documentId: document.id };
    } catch (error) {
      const dbError = ErrorHandler.handleDatabaseError(
        error as Error,
        ErrorHandler.createContext(undefined, filename, 'database-init')
      );
      degradation.recordFailure('databaseStorage', dbError);
      return { success: false };
    }
  }

  private async extractPDFWithErrorHandling(
    buffer: Buffer,
    degradation: GracefulDegradation,
    options: WorldClassProcessingOptions
  ): Promise<{
    success: boolean;
    text: string;
    metadata: { pageCount: number; wordCount: number };
    extractionWarnings: string[];
  }> {
    try {
      const extractor = new ImprovedPDFExtractor(buffer);
      const extractionResult = await RetryHandler.withRetry(
        () => extractor.extractText(),
        { maxRetries: options.retryFailedOperations ? 2 : 0 }
      );

      const detailedMetadata = await extractor.getDetailedMetadata();

      if (!extractionResult.text || extractionResult.text.length < 50) {
        if (detailedMetadata.advanced.isScanned) {
          throw new Error('Document appears to be scanned. OCR required.');
        }
        throw new Error('Insufficient text extracted from document');
      }

      return {
        success: true,
        text: extractionResult.text,
        metadata: {
          pageCount: extractionResult.pageCount,
          wordCount: extractionResult.text.split(/\s+/).filter(w => w.length > 0).length
        },
        extractionWarnings: extractionResult.warnings
      };
    } catch (error) {
      const pdfError = ErrorHandler.handlePDFError(
        error as Error,
        ErrorHandler.createContext(undefined, undefined, 'pdf-extraction')
      );
      degradation.recordFailure('pdfExtraction', pdfError);

      // Try basic extraction as fallback
      const fallbackText = this.basicTextExtraction(buffer);
      if (fallbackText.length > 50) {
        return {
          success: true,
          text: fallbackText,
          metadata: {
            pageCount: 1,
            wordCount: fallbackText.split(/\s+/).length
          },
          extractionWarnings: ['Using fallback text extraction']
        };
      }

      return {
        success: false,
        text: '',
        metadata: { pageCount: 0, wordCount: 0 },
        extractionWarnings: ['PDF extraction failed completely']
      };
    }
  }

  private basicTextExtraction(buffer: Buffer): string {
    try {
      const str = buffer.toString('utf8', 0, Math.min(buffer.length, 100000));
      const textMatches = str.match(/\(([^)]+)\)/g) || [];
      return textMatches
        .map(match => match.slice(1, -1))
        .filter(text => text.length > 2)
        .join(' ')
        .substring(0, 10000);
    } catch {
      return '';
    }
  }

  private async createChunksWithFallback(
    text: string,
    options: WorldClassProcessingOptions,
    degradation: GracefulDegradation
  ): Promise<DocumentChunk[]> {
    try {
      if (degradation.getCapabilities().advancedChunking) {
        return await this.createIntelligentChunks(text, options);
      }
    } catch (error) {
      console.warn('Advanced chunking failed, using fallback:', error);
      degradation.recordFailure('advancedChunking', new DocumentProcessingError({
        type: ErrorType.CHUNKING,
        message: 'Advanced chunking failed',
        originalError: error as Error,
        recoverable: true,
        retryable: false
      }));
    }

    // Fallback to basic chunking
    return FallbackStrategies.basicChunking(text, 1000).map((chunk, index) => ({
      ...chunk,
      chunkNumber: index + 1,
      totalChunks: 0
    }));
  }

  private async storeChunksWithRetry(
    documentId: string,
    chunks: DocumentChunk[],
    degradation: GracefulDegradation
  ): Promise<any[]> {
    try {
      return await RetryHandler.withRetry(
        () => this.storeChunks(documentId, chunks),
        { maxRetries: 2 }
      );
    } catch (error) {
      const dbError = ErrorHandler.handleDatabaseError(
        error as Error,
        ErrorHandler.createContext(documentId, undefined, 'chunk-storage')
      );
      degradation.recordFailure('databaseStorage', dbError);
      return [];
    }
  }

  private async performAnalysisWithDegradation(
    chunks: DocumentChunk[],
    originalName: string,
    options: WorldClassProcessingOptions,
    degradation: GracefulDegradation
  ): Promise<any> {
    const capabilities = degradation.getCapabilities() as any;

    // Try AI analysis first
    if (capabilities.aiAnalysis && options.multiPassAnalysis !== false) {
      try {
        return await this.circuitBreaker.execute(
          () => this.performMultiPassAnalysis(chunks, originalName, options)
        );
      } catch (error) {
        const aiError = ErrorHandler.handleAIError(
          error as Error,
          ErrorHandler.createContext(undefined, originalName, 'ai-analysis')
        );
        degradation.recordFailure('aiAnalysis', aiError);
      }
    }

    // Fallback to basic analysis
    const combinedText = chunks.map(c => c.text).join(' ');
    const basicAnalysis = await FallbackStrategies.basicAnalysis(combinedText);

    return {
      themes: basicAnalysis.themes,
      keywords: basicAnalysis.keywords,
      insights: basicAnalysis.insights,
      quotes: [],
      entities: [],
      relationships: [],
      contradictions: [],
      sentimentScore: 0.5,
      summary: basicAnalysis.insights.join('. ')
    };
  }

  private async generateEmbeddingsWithFallback(
    documentId: string,
    chunks: any[],
    degradation: GracefulDegradation
  ): Promise<void> {
    try {
      await this.circuitBreaker.execute(
        () => this.generateAndStoreEmbeddings(documentId, chunks)
      );
    } catch (error) {
      const embeddingError = ErrorHandler.handleEmbeddingError(
        error as Error,
        ErrorHandler.createContext(documentId, undefined, 'embedding-generation')
      );
      degradation.recordFailure('embeddings', embeddingError);
    }
  }

  private async storeAnalysisResults(
    documentId: string,
    analysis: any
  ): Promise<void> {
    try {
      await Promise.all([
        this.storeThemes(documentId, analysis.themes || []),
        this.storeQuotes(documentId, analysis.quotes || []),
        this.storeInsights(documentId, analysis.insights || []),
        this.storeKeywords(documentId, analysis.keywords || [])
      ]);
    } catch (error) {
      console.error('Failed to store some analysis results:', error);
      // Continue processing even if storage partially fails
    }
  }

  // Include all the original helper methods from world-class-document-processor.ts
  private async createIntelligentChunks(
    text: string,
    _options: WorldClassProcessingOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<DocumentChunk[]> {
    // Implementation from original file
    return this.chunker.chunkDocument(text);
  }

  private async storeChunks(documentId: string, chunks: DocumentChunk[]): Promise<any[]> {
    // Implementation from original file
    if (!prisma) return [];

    const chunkRecords = await Promise.all(
      chunks.map((chunk, index) =>
        prisma!.documentChunk.create({
          data: {
            documentId,
            text: chunk.text,
            chunkIndex: index,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            startPage: chunk.startPage,
            endPage: chunk.endPage,
            wordCount: chunk.wordCount || chunk.text.split(/\s+/).length,
            topics: chunk.metadata ? JSON.stringify(chunk.metadata) : undefined
          }
        })
      )
    );

    return chunkRecords;
  }

  private async performMultiPassAnalysis(
    _chunks: DocumentChunk[], // eslint-disable-line @typescript-eslint/no-unused-vars
    _originalName: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _options: WorldClassProcessingOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<any> {
    // Placeholder - implement based on your AI service
    return {
      themes: [],
      keywords: [],
      insights: [],
      quotes: [],
      entities: [],
      relationships: [],
      contradictions: [],
      sentimentScore: 0.5
    };
  }

  private async generateAndStoreEmbeddings(
    documentId: string,
    chunks: any[]
  ): Promise<void> {
    // Placeholder - implement based on your embeddings service
    for (const chunk of chunks) {
      await this.embeddingsService.generateEmbedding(chunk.text || '');
    }
  }

  private async storeThemes(documentId: string, themes: any[]): Promise<void> {
    // Implementation from original file
    if (!prisma || themes.length === 0) return;

    await Promise.all(
      themes.map(theme =>
        prisma!.documentTheme.create({
          data: {
            documentId,
            theme: theme.name || theme,
            confidence: theme.confidence || 0.8,
            context: theme.evidence || ''
          }
        })
      )
    );
  }

  private async storeQuotes(documentId: string, quotes: any[]): Promise<void> {
    // Implementation from original file
    if (!prisma || quotes.length === 0) return;

    await Promise.all(
      quotes.map(quote =>
        prisma!.documentQuote.create({
          data: {
            documentId,
            text: quote.text,
            speaker: quote.speaker,
            context: quote.context,
            confidence: quote.confidence || 0.8
          }
        })
      )
    );
  }

  private async storeInsights(documentId: string, insights: any[]): Promise<void> {
    // Implementation from original file
    if (!prisma || insights.length === 0) return;

    await Promise.all(
      insights.map(insight =>
        prisma!.documentInsight.create({
          data: {
            documentId,
            insight: typeof insight === 'string' ? insight : (insight.text || insight.content),
            type: insight.type || insight.category || 'general',
            confidence: insight.importance || insight.confidence || 0.5,
            evidence: insight.evidence ? JSON.stringify(insight.evidence) : undefined
          }
        })
      )
    );
  }

  private async storeKeywords(documentId: string, keywords: any[]): Promise<void> {
    // Implementation from original file
    if (!prisma || keywords.length === 0) return;

    await Promise.all(
      keywords.map(keyword =>
        prisma!.documentKeyword.create({
          data: {
            documentId,
            keyword: typeof keyword === 'string' ? keyword : (keyword.term || keyword.word),
            frequency: keyword.frequency || 1,
            relevance: keyword.relevance || 0.5,
            category: keyword.category
          }
        })
      )
    );
  }
}