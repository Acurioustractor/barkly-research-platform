/**
 * World-Class AI-Enhanced Document Processor
 * Provides comprehensive, multi-pass document analysis with deep insights
 */

import { prisma } from '@/lib/database-safe';
import { DocumentChunker, type DocumentChunk } from './document-chunker';
import { AdaptiveChunker } from './adaptive-chunker';
import { ImprovedPDFExtractor } from './pdf-extractor-improved';
import { 
  performDeepAnalysis,
  performCrossChunkAnalysis,
  generateComprehensiveSummary,
  type DeepAnalysisResult,
  type CrossChunkAnalysisResult
} from '@/lib/world-class-ai-service';
import { 
  extractEntitiesFromText, 
  batchExtractEntities, 
  type Entity, 
  type EntityRelationship, 
  type EntityExtractionResult 
} from '@/lib/entity-extraction-service';
import { EmbeddingsService } from '@/lib/embeddings-service';
import type { ProcessingStatus } from '@prisma/client';
import { 
  CircuitBreaker 
} from './error-handler';
import { 
  ProgressiveEnhancement 
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
}

export class WorldClassDocumentProcessor {
  private chunker: DocumentChunker;
  private embeddingsService: EmbeddingsService;
  private circuitBreaker: CircuitBreaker;
  private progressiveEnhancement: ProgressiveEnhancement;

  constructor() {
    // Initialize with smaller, more granular chunks
    this.chunker = new DocumentChunker({
      maxChunkSize: 400,  // Much smaller for granular analysis
      overlapSize: 100,   // 25% overlap for context preservation
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 50
    });
    this.embeddingsService = new EmbeddingsService();
    this.circuitBreaker = new CircuitBreaker();
    this.progressiveEnhancement = new ProgressiveEnhancement();
  }

  /**
   * Process document with world-class analysis capabilities
   */
  async processAndStoreDocument(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: WorldClassProcessingOptions = {}
  ): Promise<WorldClassProcessingResult> {
    console.log('=== Starting world-class document processing ===', {
      filename,
      originalName,
      bufferSize: buffer.length,
      options
    });
    
    let documentId: string | undefined;

    try {
      if (!prisma) {
        throw new Error('Database not available');
      }

      // Create document record
      const document = await prisma.document.create({
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
      });

      documentId = document.id;

      // Extract text from PDF with improved extractor
      const extractor = new ImprovedPDFExtractor(buffer);
      const extractionResult = await extractor.extractText();
      const detailedMetadata = await extractor.getDetailedMetadata();
      
      console.log('Text extraction result:', {
        method: extractionResult.method,
        confidence: extractionResult.confidence,
        textLength: extractionResult.text.length,
        pageCount: extractionResult.pageCount,
        warnings: extractionResult.warnings,
        isScanned: detailedMetadata.advanced.isScanned,
        pdfVersion: detailedMetadata.advanced.pdfVersion
      });

      // Handle extraction failures or low confidence
      if (!extractionResult.text || extractionResult.text.length < 50) {
        if (detailedMetadata.advanced.isScanned) {
          throw new Error('Document appears to be scanned. OCR is required but not available.');
        }
        throw new Error(`Insufficient text extracted. Method: ${extractionResult.method}, Warnings: ${extractionResult.warnings.join(', ')}`);
      }

      if (extractionResult.confidence < 0.3) {
        console.warn('Low confidence extraction:', extractionResult.confidence);
      }

      const text = extractionResult.text;
      const metadata = {
        pageCount: extractionResult.pageCount,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length
      };

      // Create chunks using selected strategy
      const chunks = await this.createIntelligentChunks(text, options);
      
      console.log('Advanced chunking result:', {
        strategy: options.chunkingStrategy || 'granular',
        chunksCount: chunks.length,
        avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length)
      });

      // Store chunks in database
      const storedChunks = await this.storeChunks(documentId, chunks);

      // Perform multi-pass deep analysis
      const analysisResults = await this.performMultiPassAnalysis(
        chunks,
        originalName,
        options
      );

      // Perform cross-chunk analysis if enabled
      let crossChunkResults: CrossChunkAnalysisResult | undefined;
      if (options.crossChunkAnalysis !== false) {
        crossChunkResults = await performCrossChunkAnalysis(
          chunks.map(c => c.text),
          analysisResults
        );
      }

      // Perform enhanced entity extraction
      let enhancedEntityResult: EntityExtractionResult | undefined;
      if (options.extractEntities !== false) {
        enhancedEntityResult = await this.performEnhancedEntityExtraction(
          chunks,
          originalName,
          options
        );
      }

      // Generate comprehensive document summary
      let comprehensiveSummary: {
        summary: string;
        executiveSummary: string;
        keyTakeaways: string[];
      } | undefined;

      if (options.generateSummary !== false) {
        comprehensiveSummary = await generateComprehensiveSummary(
          text,
          analysisResults,
          crossChunkResults,
          originalName
        );
      }

      // Aggregate and enrich results
      const aggregatedResults = this.aggregateAndEnrichResults(
        analysisResults,
        crossChunkResults,
        options
      );

      // Generate embeddings if requested
      if (options.generateEmbeddings && process.env.OPENAI_API_KEY) {
        try {
          await this.embeddingsService.storeChunkEmbeddings(
            documentId,
            storedChunks
          );
        } catch (err) {
          console.error('Failed to generate embeddings:', err);
        }
      }

      // Store all extracted data
      const storagePromises = [
        this.storeThemesWithEvidence(documentId, aggregatedResults.themes),
        this.storeQuotesWithContext(documentId, aggregatedResults.quotes),
        this.storeInsights(documentId, aggregatedResults.insights),
        this.storeKeywords(documentId, aggregatedResults.keywords),
        this.storeRelationships(documentId, aggregatedResults.relationships),
        this.storeContradictions(documentId, aggregatedResults.contradictions)
      ];

      // Store enhanced entities if available, otherwise use basic entities
      if (enhancedEntityResult && enhancedEntityResult.entities.length > 0) {
        storagePromises.push(this.storeEnhancedEntities(documentId, enhancedEntityResult));
      } else {
        storagePromises.push(this.storeEntities(documentId, aggregatedResults.entities));
      }

      await Promise.all(storagePromises);

      // Update document with comprehensive analysis
      await prisma.document.update({
        where: { id: documentId },
        data: {
          fullText: text,
          summary: comprehensiveSummary?.summary,
          pageCount: metadata.pageCount,
          wordCount: metadata.wordCount,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      const entityCount = enhancedEntityResult?.entities.length || aggregatedResults.entities.length;
      const relationshipCount = enhancedEntityResult?.relationships.length || aggregatedResults.relationships.length;

      console.log('World-class processing complete:', {
        documentId,
        chunks: chunks.length,
        themes: aggregatedResults.themes.length,
        quotes: aggregatedResults.quotes.length,
        insights: aggregatedResults.insights.length,
        entities: entityCount,
        relationships: relationshipCount,
        enhancedEntities: enhancedEntityResult ? 'enabled' : 'disabled'
      });

      return {
        documentId,
        status: 'COMPLETED',
        chunks: chunks.length,
        themes: aggregatedResults.themes.length,
        quotes: aggregatedResults.quotes.length,
        insights: aggregatedResults.insights.length,
        keywords: aggregatedResults.keywords.length,
        entities: entityCount,
        relationships: relationshipCount,
        contradictions: aggregatedResults.contradictions.length,
        sentimentScore: aggregatedResults.sentimentScore,
        summary: comprehensiveSummary?.summary,
        executiveSummary: comprehensiveSummary?.executiveSummary,
        keyTakeaways: comprehensiveSummary?.keyTakeaways
      };

    } catch (error) {
      console.error('Error in world-class processing:', error);

      if (documentId && prisma) {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }

      return {
        documentId: documentId || '',
        status: 'FAILED',
        chunks: 0,
        themes: 0,
        quotes: 0,
        insights: 0,
        keywords: 0,
        entities: 0,
        relationships: 0,
        contradictions: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create intelligent chunks using advanced strategies
   */
  private async createIntelligentChunks(
    text: string,
    options: WorldClassProcessingOptions
  ): Promise<DocumentChunk[]> {
    // Use the new adaptive chunker for intelligent segmentation
    const strategy = options.chunkingStrategy || 'granular';
    const maxSize = options.maxChunkSize || 400;
    const minSize = options.minChunkSize || 50;
    const overlapPct = options.overlapPercentage || 25;

    // Configure adaptive chunker based on strategy
    const adaptiveOptions: any = {
      minChunkSize: minSize,
      maxChunkSize: maxSize,
      targetChunkSize: Math.floor((minSize + maxSize) / 2),
      overlapPercentage: overlapPct,
      preserveSentences: true,
      preserveParagraphs: true,
      detectHeaders: true,
      detectLists: true,
      detectQuotes: true
    };

    switch (strategy) {
      case 'granular':
        // Use sliding window for maximum coverage
        adaptiveOptions.strategy = 'sliding';
        adaptiveOptions.overlapPercentage = Math.max(25, overlapPct);
        break;
      
      case 'semantic':
        // Use semantic boundaries
        adaptiveOptions.strategy = 'semantic';
        adaptiveOptions.preserveSections = true;
        break;
      
      case 'hybrid':
        // Use hybrid approach
        adaptiveOptions.strategy = 'hybrid';
        adaptiveOptions.detectCodeBlocks = true;
        break;
    }

    // Create adaptive chunker and process text
    const adaptiveChunker = new AdaptiveChunker(adaptiveOptions);
    const adaptiveChunks = await adaptiveChunker.chunkDocument(text);

    // Convert to DocumentChunk format with enhanced metadata
    return adaptiveChunks.map((chunk, index) => ({
      index,
      text: chunk.text,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      wordCount: chunk.metadata.wordCount,
      chunkNumber: chunk.metadata.chunkNumber,
      totalChunks: chunk.metadata.totalChunks,
      metadata: {
        hasHeaders: chunk.metadata.hasHeader,
        headerText: chunk.metadata.headerText,
        contentType: chunk.metadata.contentType === 'text' ? 'narrative' : 
                    chunk.metadata.contentType === 'list' ? 'list' : 
                    chunk.metadata.contentType === 'code' ? 'mixed' : 
                    chunk.metadata.contentType as any,
        semanticDensity: chunk.metadata.semanticDensity,
        contextualImportance: chunk.metadata.contextualImportance,
        relatedChunks: chunk.relatedChunks
      }
    }));
  }

  /**
   * Create small, overlapping chunks for granular analysis
   */
  private createGranularChunks(
    text: string,
    maxSize: number,
    minSize: number,
    overlapPct: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const stride = Math.floor(maxSize * (1 - overlapPct / 100));
    let position = 0;
    let chunkIndex = 0;

    while (position < text.length) {
      // Find the best ending position
      let endPos = Math.min(position + maxSize, text.length);
      
      // Try to end at a sentence boundary
      if (endPos < text.length) {
        const sentenceEnd = this.findSentenceBoundary(text, position, endPos);
        if (sentenceEnd > position + minSize) {
          endPos = sentenceEnd;
        }
      }

      const chunkText = text.substring(position, endPos).trim();
      
      if (chunkText.length >= minSize) {
        chunks.push({
          index: chunkIndex++,
          text: chunkText,
          startChar: position,
          endChar: endPos,
          wordCount: this.countWords(chunkText),
          metadata: this.analyzeChunkContent(chunkText)
        });
      }

      position += stride;
    }

    return chunks;
  }

  /**
   * Create chunks based on semantic boundaries
   */
  private createSemanticChunks(text: string, maxSize: number): DocumentChunk[] {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;
    let currentPosition = 0;

    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxSize) {
        // Small paragraph, use as-is
        chunks.push({
          index: chunkIndex++,
          text: paragraph.trim(),
          startChar: currentPosition,
          endChar: currentPosition + paragraph.length,
          wordCount: this.countWords(paragraph),
          metadata: this.analyzeChunkContent(paragraph)
        });
      } else {
        // Large paragraph, split by sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        let currentChunk = '';
        let chunkStart = currentPosition;

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= maxSize) {
            currentChunk += sentence;
          } else {
            if (currentChunk.trim().length > 0) {
              chunks.push({
                index: chunkIndex++,
                text: currentChunk.trim(),
                startChar: chunkStart,
                endChar: chunkStart + currentChunk.length,
                wordCount: this.countWords(currentChunk),
                metadata: this.analyzeChunkContent(currentChunk)
              });
            }
            currentChunk = sentence;
            chunkStart = currentPosition + paragraph.indexOf(sentence);
          }
        }

        // Add remaining chunk
        if (currentChunk.trim().length > 0) {
          chunks.push({
            index: chunkIndex++,
            text: currentChunk.trim(),
            startChar: chunkStart,
            endChar: chunkStart + currentChunk.length,
            wordCount: this.countWords(currentChunk),
            metadata: this.analyzeChunkContent(currentChunk)
          });
        }
      }

      currentPosition += paragraph.length + 2; // Account for paragraph break
    }

    return chunks;
  }

  /**
   * Create hybrid chunks combining granular and semantic approaches
   */
  private createHybridChunks(
    text: string,
    maxSize: number,
    minSize: number,
    overlapPct: number
  ): DocumentChunk[] {
    // First create semantic chunks
    const semanticChunks = this.createSemanticChunks(text, maxSize * 2);
    
    // Then create granular chunks within each semantic chunk
    const finalChunks: DocumentChunk[] = [];
    let globalIndex = 0;

    for (const semanticChunk of semanticChunks) {
      const granularChunks = this.createGranularChunks(
        semanticChunk.text,
        maxSize,
        minSize,
        overlapPct
      );

      for (const granularChunk of granularChunks) {
        finalChunks.push({
          ...granularChunk,
          index: globalIndex++,
          startChar: semanticChunk.startChar + granularChunk.startChar,
          endChar: semanticChunk.startChar + granularChunk.endChar,
          metadata: {
            ...granularChunk.metadata
          }
        });
      }
    }

    return finalChunks;
  }

  /**
   * Perform multi-pass analysis on chunks
   */
  private async performMultiPassAnalysis(
    chunks: DocumentChunk[],
    documentName: string,
    options: WorldClassProcessingOptions
  ): Promise<DeepAnalysisResult[]> {
    const results: DeepAnalysisResult[] = [];
    const depth = options.analysisDepth || 'deep';
    const passes = depth === 'exhaustive' ? 3 : depth === 'deep' ? 2 : 1;

    // Process chunks in smaller batches for better rate limiting
    const batchSize = 5;
    const chunkBatches = this.batchArray(chunks, batchSize);

    for (const batch of chunkBatches) {
      const batchPromises = batch.map(chunk => 
        performDeepAnalysis(
          chunk.text,
          documentName,
          {
            chunkIndex: chunk.index || 0,
            totalChunks: chunks.length,
            previousChunk: chunk.index && chunk.index > 0 ? chunks[chunk.index - 1]?.text : undefined,
            nextChunk: chunk.index && chunk.index < chunks.length - 1 ? chunks[chunk.index + 1]?.text : undefined,
            analysisDepth: depth,
            numberOfPasses: passes,
            extractEntities: options.extractEntities !== false,
            detectSentiment: options.detectSentiment !== false,
            identifyContradictions: options.identifyContradictions !== false,
            minThemes: Math.ceil((options.minThemesPerDocument || 20) / chunks.length),
            minQuotes: Math.ceil((options.minQuotesPerDocument || 30) / chunks.length),
            minInsights: Math.ceil((options.minInsightsPerDocument || 25) / chunks.length)
          }
        ).catch(err => {
          console.error(`Deep analysis failed for chunk ${chunk.index}:`, err);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null) as DeepAnalysisResult[]);
    }

    return results;
  }

  /**
   * Aggregate and enrich analysis results
   */
  private aggregateAndEnrichResults(
    analysisResults: DeepAnalysisResult[],
    crossChunkResults?: CrossChunkAnalysisResult,
    options?: WorldClassProcessingOptions
  ) {
    // Aggregate themes with deduplication and confidence boosting
    const themes = this.aggregateThemes(analysisResults);
    
    // Aggregate quotes and rank by significance
    const quotes = this.aggregateQuotes(analysisResults);
    
    // Aggregate and categorize insights
    const insights = this.aggregateInsights(analysisResults, crossChunkResults);
    
    // Aggregate keywords with frequency analysis
    const keywords = this.aggregateKeywords(analysisResults);
    
    // Aggregate entities with relationship mapping
    const entities = this.aggregateEntities(analysisResults);
    
    // Extract relationships from cross-chunk analysis
    const relationships = crossChunkResults?.relationships || [];
    
    // Extract contradictions
    const contradictions = crossChunkResults?.contradictions || [];
    
    // Calculate overall sentiment
    const sentimentScore = this.calculateOverallSentiment(analysisResults);

    // Apply minimum thresholds
    const minThemes = options?.minThemesPerDocument || 20;
    const minQuotes = options?.minQuotesPerDocument || 30;
    const minInsights = options?.minInsightsPerDocument || 25;

    return {
      themes: themes.slice(0, Math.max(themes.length, minThemes)),
      quotes: quotes.slice(0, Math.max(quotes.length, minQuotes)),
      insights: insights.slice(0, Math.max(insights.length, minInsights)),
      keywords,
      entities,
      relationships,
      contradictions,
      sentimentScore
    };
  }

  /**
   * Aggregate themes with sophisticated deduplication
   */
  private aggregateThemes(results: DeepAnalysisResult[]) {
    const themeMap = new Map<string, {
      confidence: number;
      evidence: string[];
      occurrences: number;
      relatedThemes: Set<string>;
    }>();

    for (const result of results) {
      for (const theme of result.themes) {
        const key = this.normalizeThemeName(theme.name);
        const existing = themeMap.get(key);
        
        if (existing) {
          existing.confidence = Math.max(existing.confidence, theme.confidence);
          existing.evidence.push(theme.evidence);
          existing.occurrences++;
          if (theme.relatedThemes) {
            theme.relatedThemes.forEach(rt => existing.relatedThemes.add(rt));
          }
        } else {
          themeMap.set(key, {
            confidence: theme.confidence,
            evidence: [theme.evidence],
            occurrences: 1,
            relatedThemes: new Set(theme.relatedThemes || [])
          });
        }
      }
    }

    return Array.from(themeMap.entries())
      .map(([name, data]) => ({
        name,
        confidence: data.confidence,
        evidence: this.consolidateEvidence(data.evidence),
        occurrences: data.occurrences,
        relatedThemes: Array.from(data.relatedThemes)
      }))
      .sort((a, b) => {
        // Sort by combination of confidence and occurrences
        const scoreA = a.confidence * Math.log(a.occurrences + 1);
        const scoreB = b.confidence * Math.log(b.occurrences + 1);
        return scoreB - scoreA;
      });
  }

  /**
   * Aggregate quotes with ranking
   */
  private aggregateQuotes(results: DeepAnalysisResult[]) {
    const allQuotes = results.flatMap(r => r.quotes);
    
    // Remove duplicate quotes and merge significance scores
    const uniqueQuotes = new Map<string, any>();
    
    for (const quote of allQuotes) {
      const key = quote.text.toLowerCase().trim();
      const existing = uniqueQuotes.get(key);
      
      if (existing) {
        existing.confidence = Math.max(existing.confidence, quote.confidence);
        existing.significance = this.mergeSignificance(existing.significance, quote.significance);
      } else {
        uniqueQuotes.set(key, { ...quote });
      }
    }

    return Array.from(uniqueQuotes.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Aggregate insights with categorization
   */
  private aggregateInsights(
    results: DeepAnalysisResult[],
    crossChunkResults?: CrossChunkAnalysisResult
  ) {
    const allInsights = [
      ...results.flatMap(r => r.insights),
      ...(crossChunkResults?.insights || [])
    ];

    // Deduplicate and categorize insights
    const insightMap = new Map<string, any>();
    
    for (const insight of allInsights) {
      const key = this.normalizeInsightText(insight.text);
      const existing = insightMap.get(key);
      
      if (existing) {
        existing.importance = Math.max(existing.importance, insight.importance);
        if ('actionability' in existing && 'actionability' in insight) {
          existing.actionability = Math.max(existing.actionability || 0, insight.actionability || 0);
        }
      } else {
        insightMap.set(key, { ...insight });
      }
    }

    return Array.from(insightMap.values())
      .sort((a, b) => {
        // Sort by combination of importance and actionability
        const actionabilityA = 'actionability' in a ? (a.actionability || 0) : 0;
        const actionabilityB = 'actionability' in b ? (b.actionability || 0) : 0;
        const scoreA = a.importance + actionabilityA * 0.5;
        const scoreB = b.importance + actionabilityB * 0.5;
        return scoreB - scoreA;
      });
  }

  /**
   * Aggregate keywords with frequency analysis
   */
  private aggregateKeywords(results: DeepAnalysisResult[]) {
    const keywordMap = new Map<string, {
      frequency: number;
      category: string;
      contexts: string[];
    }>();

    for (const result of results) {
      for (const keyword of result.keywords) {
        const key = keyword.term.toLowerCase();
        const existing = keywordMap.get(key);
        
        if (existing) {
          existing.frequency += keyword.frequency;
          existing.contexts.push(keyword.context || '');
        } else {
          keywordMap.set(key, {
            frequency: keyword.frequency,
            category: keyword.category,
            contexts: [keyword.context || '']
          });
        }
      }
    }

    return Array.from(keywordMap.entries())
      .map(([term, data]) => ({
        term,
        frequency: data.frequency,
        category: data.category,
        contexts: data.contexts.filter(c => c.length > 0)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // Top 50 keywords
  }

  /**
   * Aggregate entities with deduplication
   */
  private aggregateEntities(results: DeepAnalysisResult[]) {
    const entityMap = new Map<string, {
      type: string;
      mentions: number;
      contexts: string[];
      attributes: Record<string, any>;
    }>();

    for (const result of results) {
      if (!result.entities) continue;
      
      for (const entity of result.entities) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`;
        const existing = entityMap.get(key);
        
        if (existing) {
          existing.mentions += entity.mentions || 1;
          existing.contexts.push(...(entity.contexts || []));
          Object.assign(existing.attributes, entity.attributes || {});
        } else {
          entityMap.set(key, {
            type: entity.type,
            mentions: entity.mentions || 1,
            contexts: entity.contexts || [],
            attributes: entity.attributes || {}
          });
        }
      }
    }

    return Array.from(entityMap.entries())
      .map(([key, data]) => ({
        name: key.split(':')[1],
        type: data.type,
        mentions: data.mentions,
        contexts: data.contexts,
        attributes: data.attributes
      }))
      .sort((a, b) => b.mentions - a.mentions);
  }

  /**
   * Calculate overall sentiment from chunk sentiments
   */
  private calculateOverallSentiment(results: DeepAnalysisResult[]): number {
    const sentiments = results
      .map(r => r.sentiment)
      .filter(s => s !== undefined && s !== null) as number[];
    
    if (sentiments.length === 0) return 0;
    
    // Weighted average based on chunk importance
    const weightedSum = sentiments.reduce((sum, sentiment, index) => {
      const weight = results[index].insights.length + results[index].themes.length;
      return sum + sentiment * weight;
    }, 0);
    
    const totalWeight = results.reduce((sum, r) => 
      sum + r.insights.length + r.themes.length, 0
    );
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Helper methods

  private normalizeThemeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  private normalizeInsightText(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '').substring(0, 50);
  }

  private consolidateEvidence(evidence: string[]): string {
    // Remove duplicates and combine similar evidence
    const unique = Array.from(new Set(evidence));
    return unique.slice(0, 5).join(' | ');
  }

  private mergeSignificance(sig1: string, sig2: string): string {
    // Combine significance descriptions intelligently
    if (sig1.includes(sig2) || sig2.includes(sig1)) {
      return sig1.length > sig2.length ? sig1 : sig2;
    }
    return `${sig1}; ${sig2}`;
  }

  private findSentenceBoundary(text: string, start: number, max: number): number {
    const searchText = text.substring(start, max);
    const lastPeriod = searchText.lastIndexOf('.');
    const lastQuestion = searchText.lastIndexOf('?');
    const lastExclamation = searchText.lastIndexOf('!');
    
    const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    return lastSentence > 0 ? start + lastSentence + 1 : max;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private analyzeChunkContent(text: string): DocumentChunk['metadata'] {
    return {
      hasHeaders: /^#{1,6}\s+.+$/m.test(text),
      hasBulletPoints: /^[\s]*[-*•]\s+/m.test(text),
      hasQuotes: /"[^"]{10,}"/g.test(text),
      contentType: this.detectContentType(text)
    };
  }

  private detectContentType(text: string): 'narrative' | 'list' | 'table' | 'mixed' {
    const bulletCount = (text.match(/^[\s]*[-*•]\s+/gm) || []).length;
    const lineCount = text.split('\n').length;
    const hasTable = text.includes('|') && text.split('\n').some(line => line.includes('|'));
    
    if (hasTable) return 'table';
    if (bulletCount > lineCount * 0.3) return 'list';
    if (bulletCount > 0) return 'mixed';
    return 'narrative';
  }

  private batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Database storage methods (similar to original but with additional tables)

  private async storeChunks(documentId: string, chunks: DocumentChunk[]): Promise<Array<{ id: string; text: string }>> {
    if (!prisma) return [];
    
    const chunkData = chunks.map(chunk => ({
      documentId,
      chunkIndex: chunk.index ?? 0,
      startPage: chunk.startPage ?? 0,
      endPage: chunk.endPage ?? 0,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
      text: chunk.text,
      wordCount: chunk.wordCount || chunk.text.split(/\s+/).filter(w => w.length > 0).length,
      topics: chunk.metadata ? JSON.stringify(chunk.metadata) : undefined
    }));

    await prisma.documentChunk.createMany({ data: chunkData });

    const storedChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      select: { id: true, text: true },
      orderBy: { chunkIndex: 'asc' }
    });

    return storedChunks;
  }

  private async storeThemesWithEvidence(documentId: string, themes: any[]): Promise<void> {
    if (!prisma) return;
    
    const themeData = themes.map(theme => ({
      documentId,
      theme: theme.name,
      confidence: theme.confidence,
      context: theme.evidence,
      metadata: JSON.stringify({
        occurrences: theme.occurrences,
        relatedThemes: theme.relatedThemes
      })
    }));

    await prisma.documentTheme.createMany({ data: themeData });
  }

  private async storeQuotesWithContext(documentId: string, quotes: any[]): Promise<void> {
    if (!prisma) return;
    
    const quoteData = quotes.map(quote => ({
      documentId,
      text: quote.text,
      context: quote.context,
      page: quote.page || 0,
      speaker: quote.speaker,
      category: quote.category,
      confidence: quote.confidence,
      metadata: JSON.stringify({
        significance: quote.significance,
        sentiment: quote.sentiment
      })
    }));

    await prisma.documentQuote.createMany({ data: quoteData });
  }

  private async storeInsights(documentId: string, insights: any[]): Promise<void> {
    if (!prisma) return;
    
    const insightData = insights.map(insight => ({
      documentId,
      insight: insight.text,
      type: insight.category || 'general',
      confidence: insight.importance / 10,
      evidence: insight.evidence,
      metadata: JSON.stringify({
        actionability: insight.actionability,
        stakeholders: insight.stakeholders
      })
    }));

    await prisma.documentInsight.createMany({ data: insightData });
  }

  private async storeKeywords(documentId: string, keywords: any[]): Promise<void> {
    if (!prisma) return;
    
    const keywordData = keywords.map(keyword => ({
      documentId,
      keyword: keyword.term,
      frequency: keyword.frequency,
      relevance: Math.min(keyword.frequency / 100, 1),
      category: keyword.category,
      metadata: JSON.stringify({
        contexts: keyword.contexts
      })
    }));

    await prisma.documentKeyword.createMany({ data: keywordData });
  }

  private async storeEntities(documentId: string, entities: any[]): Promise<void> {
    if (!prisma || !entities || entities.length === 0) return;
    
    // Store entities in the documentEntity table
    const entityData = entities.map(entity => ({
      documentId: documentId,
      name: entity.name,
      type: entity.type,
      category: entity.category || null,
      confidence: entity.confidence || null,
      context: entity.contexts ? entity.contexts.join(' | ') : (entity.evidence || null),
    }));
    
    await prisma.documentEntity.createMany({ data: entityData });
  }

  /**
   * Enhanced entity extraction using the specialized entity extraction service
   */
  private async performEnhancedEntityExtraction(
    chunks: DocumentChunk[],
    documentName: string,
    options: WorldClassProcessingOptions
  ): Promise<EntityExtractionResult> {
    if (!options.extractEntities) {
      return { entities: [], relationships: [], entityMap: new Map() };
    }

    try {
      console.log('Performing enhanced entity extraction...');
      
      // Extract text from chunks
      const textChunks = chunks.map(chunk => chunk.text);
      
      // Use batch extraction for better performance and entity merging
      const result = await batchExtractEntities(
        textChunks,
        documentName,
        {
          includeRelationships: options.mapRelationships !== false,
          minConfidence: 0.4,
          batchSize: 3 // Process 3 chunks at a time
        }
      );

      console.log('Enhanced entity extraction completed:', {
        entitiesFound: result.entities.length,
        relationshipsFound: result.relationships.length,
        topEntities: result.entities.slice(0, 5).map(e => ({ name: e.name, type: e.type, confidence: e.confidence }))
      });

      return result;
    } catch (error) {
      console.error('Enhanced entity extraction failed:', error);
      // Fallback to basic entity extraction from AI analysis
      return { entities: [], relationships: [], entityMap: new Map() };
    }
  }

  /**
   * Store enhanced entities with relationships
   */
  private async storeEnhancedEntities(
    documentId: string, 
    entityResult: EntityExtractionResult
  ): Promise<void> {
    if (!prisma || entityResult.entities.length === 0) return;
    
    try {
      // Store entities
      const entityData = entityResult.entities.map(entity => ({
        documentId: documentId,
        name: entity.name,
        type: entity.type,
        category: entity.category || null,
        confidence: entity.confidence,
        context: entity.contexts.join(' | '),
      }));
      
      await prisma.documentEntity.createMany({ data: entityData });
      
      // Store relationships if we have them
      if (entityResult.relationships.length > 0) {
        await this.storeEntityRelationships(documentId, entityResult.relationships);
      }
      
      console.log('Enhanced entities stored:', {
        entities: entityResult.entities.length,
        relationships: entityResult.relationships.length
      });
    } catch (error) {
      console.error('Failed to store enhanced entities:', error);
    }
  }

  /**
   * Store entity relationships using the new relationships service
   */
  private async storeEntityRelationships(
    documentId: string, 
    relationships: EntityRelationship[]
  ): Promise<void> {
    if (!relationships || relationships.length === 0) return;

    try {
      // Import the relationships service
      const { entityRelationshipsService } = await import('../lib/entity-relationships-service');
      
      // Get entity name to ID mapping
      const entities = await prisma?.documentEntity.findMany({
        where: { documentId },
        select: { id: true, name: true }
      });

      if (!entities || entities.length === 0) {
        console.warn('No entities found for relationship storage');
        return;
      }

      const entityNameToIdMap = new Map<string, string>();
      entities.forEach(entity => {
        entityNameToIdMap.set(entity.name, entity.id);
      });

      // Store relationships
      const storedRelationships = await entityRelationshipsService.storeEntityRelationships(
        documentId,
        relationships,
        entityNameToIdMap
      );

      console.log('Entity relationships stored successfully:', {
        documentId,
        totalExtracted: relationships.length,
        stored: storedRelationships.length,
        sampleRelationships: storedRelationships.slice(0, 3).map(r => ({
          from: r.fromEntity?.name,
          to: r.toEntity?.name,
          type: r.relationship,
          strength: r.strength
        }))
      });

    } catch (error) {
      console.error('Failed to store entity relationships:', error);
    }
  }

  private async storeRelationships(_documentId: string, _relationships: any[]): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!prisma) return;
    
    // Store relationships between entities/themes
    // This would need a new table in the schema
  }

  private async storeContradictions(_documentId: string, _contradictions: any[]): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!prisma) return;
    
    // Store identified contradictions
    // This would need a new table in the schema
  }
}