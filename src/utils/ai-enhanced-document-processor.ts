/**
 * AI-Enhanced document processor that uses OpenAI/Anthropic for intelligent analysis
 * Provides superior document understanding compared to pattern matching
 */

import { prisma } from '@/lib/database-safe';
import { DocumentChunker, type DocumentChunk } from './document-chunker';
import { ImprovedPDFExtractor, type ExtractionResult } from './pdf-extractor-improved';
import { 
  analyzeDocumentChunk, 
  generateDocumentSummary,
  type AIAnalysisResult 
} from '@/lib/ai-service';
import { EmbeddingsService } from '@/lib/embeddings-service';
import { extractSystemsFromDocument, storeSystemsData } from '@/lib/systems-extraction-service';
import type { ProcessingStatus } from '@prisma/client';

export interface AIProcessingOptions {
  source?: string;
  category?: string;
  tags?: string[];
  chunkSize?: number;
  overlapSize?: number;
  preserveStructure?: boolean;
  useAI?: boolean; // Allow fallback to pattern matching
  generateSummary?: boolean;
  generateEmbeddings?: boolean; // Generate vector embeddings for semantic search
  extractSystems?: boolean; // Extract system entities and relationships
}

export interface AIProcessingResult {
  documentId: string;
  status: ProcessingStatus;
  chunks: number;
  themes: number;
  quotes: number;
  insights: number;
  keywords: number;
  summary?: string;
  errorMessage?: string;
}

export class AIEnhancedDocumentProcessor {
  private chunker: DocumentChunker;
  private embeddingsService: EmbeddingsService;

  constructor() {
    this.chunker = new DocumentChunker({
      maxChunkSize: 500,  // Much smaller for granular analysis
      overlapSize: 150,   // 30% overlap for rich context
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 100   // Ensure meaningful chunks
    });
    this.embeddingsService = new EmbeddingsService();
  }

  /**
   * Process and store a document with AI-powered analysis
   */
  async processAndStoreDocument(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: AIProcessingOptions = {}
  ): Promise<AIProcessingResult> {
    console.log('=== Starting document processing ===', {
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
      let text: string;
      let metadata: { pageCount: number; wordCount: number };
      let extractionResult: ExtractionResult;
      
      try {
        const extractor = new ImprovedPDFExtractor(buffer);
        extractionResult = await extractor.extractText();
        const detailedMetadata = await extractor.getDetailedMetadata();
        
        // Handle extraction results
        if (!extractionResult.text || extractionResult.text.length < 50) {
          if (detailedMetadata.advanced.isScanned) {
            throw new Error('Document appears to be scanned. OCR is required but not available.');
          }
          throw new Error(`Insufficient text extracted. Method: ${extractionResult.method}, Warnings: ${extractionResult.warnings.join(', ')}`);
        }
        
        text = extractionResult.text;
        metadata = {
          pageCount: extractionResult.pageCount,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length
        };
        
        console.log('Text extraction result:', {
          method: extractionResult.method,
          confidence: extractionResult.confidence,
          textLength: text.length,
          textPreview: text.substring(0, 100),
          metadata,
          warnings: extractionResult.warnings,
          isScanned: detailedMetadata.advanced.isScanned
        });
        
        // Log warning for low confidence
        if (extractionResult.confidence < 0.3) {
          console.warn('Low confidence extraction:', extractionResult.confidence);
        }
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        throw new Error(`PDF extraction failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      }

      // Create chunks with multiple strategies for comprehensive analysis
      const standardChunks = this.chunker.chunkDocument(text);
      const slidingChunks = this.chunker.createSlidingWindowChunks(text, 400, 200); // 50% overlap
      
      // Combine chunks for maximum coverage
      const allChunks = [...standardChunks];
      const chunkTexts = new Set(standardChunks.map(c => c.text));
      
      // Add unique sliding chunks
      for (const chunk of slidingChunks) {
        if (!chunkTexts.has(chunk.text)) {
          allChunks.push(chunk);
          chunkTexts.add(chunk.text);
        }
      }
      
      // Sort by position
      const chunks = allChunks.sort((a, b) => a.startChar - b.startChar);
      
      console.log('Chunking result:', {
        standardChunksCount: standardChunks.length,
        slidingChunksCount: slidingChunks.length,
        totalUniqueChunks: chunks.length,
        averageChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length),
        firstChunk: chunks[0]
      });

      // Store chunks in database
      const storedChunks = await this.storeChunks(documentId, chunks);

      // Analyze chunks with AI
      const analysisResults: AIAnalysisResult[] = [];
      const useAI = options.useAI !== false && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
      
      console.log('AI Processing Debug:', {
        useAI,
        optionsUseAI: options.useAI,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        chunksCount: chunks.length
      });

      if (useAI) {
        // Process chunks in parallel (with rate limiting)
        const chunkBatches = this.batchArray(chunks, 2); // Process 2 at a time for better quality
        
        for (const batch of chunkBatches) {
          const batchResults = await Promise.all(
            batch.map(chunk => 
              analyzeDocumentChunk(chunk.text, originalName)
                .catch(err => {
                  console.error('AI analysis failed for chunk:', err);
                  return null;
                })
            )
          );
          
          analysisResults.push(...batchResults.filter(r => r !== null) as AIAnalysisResult[]);
        }
      }

      // Generate embeddings if requested
      if (options.generateEmbeddings && process.env.OPENAI_API_KEY) {
        try {
          await this.embeddingsService.storeChunkEmbeddings(
            documentId,
            storedChunks
          );
        } catch (err) {
          console.error('Failed to generate embeddings:', err);
          // Don't fail the entire process if embeddings fail
        }
      }

      // Extract system entities and relationships if requested
      if (options.extractSystems && useAI) {
        try {
          console.log('Extracting system entities and relationships...');
          const { entities, relationships } = await extractSystemsFromDocument(
            documentId,
            storedChunks
          );
          
          await storeSystemsData(documentId, entities, relationships);
          
          console.log('Systems extraction complete:', {
            entitiesFound: entities.size,
            relationshipsFound: relationships.length
          });
        } catch (err) {
          console.error('Failed to extract systems:', err);
          // Don't fail the entire process if systems extraction fails
        }
      }

      // Aggregate results
      const aggregatedResults = useAI 
        ? this.aggregateAnalysisResults(analysisResults)
        : { themes: [], quotes: [], insights: [], keywords: [], summaries: [] };

      // Generate document summary if requested
      let summary: string | undefined;
      if (options.generateSummary && useAI) {
        try {
          summary = await generateDocumentSummary(
            chunks.map(c => c.text),
            originalName
          );
        } catch (err) {
          console.error('Summary generation failed:', err);
        }
      }

      // Store analysis results
      await Promise.all([
        this.storeThemesWithEvidence(documentId, aggregatedResults.themes),
        this.storeQuotesWithContext(documentId, aggregatedResults.quotes),
        this.storeInsights(documentId, aggregatedResults.insights),
        this.storeKeywords(documentId, aggregatedResults.keywords)
      ]);

      // Update document with processed content and status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          fullText: text,
          summary: summary || aggregatedResults.summaries.join('\n\n'),
          pageCount: metadata.pageCount,
          wordCount: metadata.wordCount,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      console.log('=== WORLD-CLASS PROCESSING COMPLETE ===', {
        documentId,
        metrics: {
          chunks: {
            total: chunks.length,
            averageSize: Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length),
            processed: analysisResults.length
          },
          extraction: {
            themes: aggregatedResults.themes.length,
            quotes: aggregatedResults.quotes.length,
            insights: aggregatedResults.insights.length,
            keywords: aggregatedResults.keywords.length,
            averageThemesPerChunk: (aggregatedResults.themes.length / chunks.length).toFixed(1),
            averageQuotesPerChunk: (aggregatedResults.quotes.length / chunks.length).toFixed(1)
          },
          quality: {
            highConfidenceThemes: aggregatedResults.themes.filter(t => t.confidence > 0.8).length,
            actionableInsights: aggregatedResults.insights.filter(i => i.importance >= 8).length,
            uniqueKeywords: new Set(aggregatedResults.keywords.map(k => k.term)).size
          }
        },
        useAI
      });

      return {
        documentId,
        status: 'COMPLETED',
        chunks: chunks.length,
        themes: aggregatedResults.themes.length,
        quotes: aggregatedResults.quotes.length,
        insights: aggregatedResults.insights.length,
        keywords: aggregatedResults.keywords.length,
        summary
      };

    } catch (error) {
      console.error('Error processing document:', error);

      // Update document status to failed if it was created
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
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Aggregate analysis results from multiple chunks
   */
  private aggregateAnalysisResults(results: AIAnalysisResult[]) {
    const themes = new Map<string, { confidence: number; evidence: string[] }>();
    const quotes: Array<any> = [];
    const insights: Array<any> = [];
    const keywords = new Map<string, { frequency: number; category: string }>();
    const summaries: string[] = [];

    for (const result of results) {
      // Aggregate themes
      for (const theme of result.themes) {
        const existing = themes.get(theme.name);
        if (existing) {
          existing.confidence = Math.max(existing.confidence, theme.confidence);
          existing.evidence.push(theme.evidence);
        } else {
          themes.set(theme.name, {
            confidence: theme.confidence,
            evidence: [theme.evidence]
          });
        }
      }

      // Collect quotes
      quotes.push(...result.quotes);

      // Collect insights
      insights.push(...result.insights);

      // Aggregate keywords
      for (const keyword of result.keywords) {
        const existing = keywords.get(keyword.term);
        if (existing) {
          existing.frequency += keyword.frequency;
        } else {
          keywords.set(keyword.term, {
            frequency: keyword.frequency,
            category: keyword.category
          });
        }
      }

      // Collect summaries
      if (result.summary) {
        summaries.push(result.summary);
      }
    }

    // Convert maps to arrays and sort by relevance
    return {
      themes: Array.from(themes.entries())
        .map(([name, data]) => ({
          name,
          confidence: data.confidence,
          evidence: data.evidence.join(' | ')
        }))
        .sort((a, b) => b.confidence - a.confidence),
      quotes: quotes
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 20), // Top 20 quotes
      insights: insights
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 15), // Top 15 insights
      keywords: Array.from(keywords.entries())
        .map(([term, data]) => ({
          term,
          frequency: data.frequency,
          category: data.category
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 30), // Top 30 keywords
      summaries
    };
  }

  /**
   * Store document chunks in database and return them with IDs
   */
  private async storeChunks(documentId: string, chunks: DocumentChunk[]): Promise<Array<{ id: string; text: string }>> {
    if (!prisma) return [];
    
    const chunkData = chunks.map((chunk, idx) => ({
      documentId,
      chunkIndex: chunk.index ?? idx,
      startPage: chunk.startPage ?? 0,
      endPage: chunk.endPage ?? 0,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
      text: chunk.text,
      wordCount: chunk.wordCount ?? chunk.text.split(/\s+/).length,
      topics: chunk.metadata ? JSON.stringify(chunk.metadata) : undefined
    }));

    await prisma.documentChunk.createMany({
      data: chunkData
    });

    // Fetch the created chunks to get their IDs
    const storedChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      select: { id: true, text: true },
      orderBy: { chunkIndex: 'asc' }
    });

    return storedChunks;
  }

  /**
   * Store themes with evidence
   */
  private async storeThemesWithEvidence(
    documentId: string, 
    themes: Array<{ name: string; confidence: number; evidence: string }>
  ): Promise<void> {
    if (!prisma) return;
    
    const themeData = themes.map(theme => ({
      documentId,
      theme: theme.name,
      confidence: theme.confidence,
      context: theme.evidence.substring(0, 500) // Limit evidence length
    }));

    await prisma.documentTheme.createMany({
      data: themeData
    });
  }

  /**
   * Store quotes with context
   */
  private async storeQuotesWithContext(
    documentId: string,
    quotes: Array<{ text: string; context: string; significance: string; confidence: number }>
  ): Promise<void> {
    if (!prisma) return;
    
    const quoteData = quotes.map((quote) => ({
      documentId,
      text: quote.text,
      context: quote.context,
      page: 0, // Would need to extract from chunk metadata
      speaker: null,
      category: null,
      confidence: quote.confidence
    }));

    await prisma.documentQuote.createMany({
      data: quoteData
    });
  }

  /**
   * Store insights
   */
  private async storeInsights(
    documentId: string,
    insights: Array<{ text: string; category: string; importance: number }>
  ): Promise<void> {
    if (!prisma) return;
    
    const insightData = insights.map(insight => ({
      documentId,
      insight: insight.text,
      type: insight.category || 'general',
      confidence: insight.importance / 10, // Convert 1-10 scale to 0-1
      evidence: undefined
    }));

    await prisma.documentInsight.createMany({
      data: insightData
    });
  }

  /**
   * Store keywords
   */
  private async storeKeywords(
    documentId: string,
    keywords: Array<{ term: string; frequency: number; category: string }>
  ): Promise<void> {
    if (!prisma) return;
    
    const keywordData = keywords.map(keyword => ({
      documentId,
      keyword: keyword.term,
      frequency: keyword.frequency,
      relevance: Math.min(keyword.frequency / 100, 1), // Simple relevance based on frequency
      category: keyword.category
    }));

    await prisma.documentKeyword.createMany({
      data: keywordData
    });
  }

  /**
   * Utility to batch array items
   */
  private batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process multiple documents in batch
   */
  async processBatchDocuments(
    documents: Array<{ buffer: Buffer; filename: string; originalName: string }>,
    options: AIProcessingOptions = {}
  ): Promise<AIProcessingResult[]> {
    const results = [];

    // Process documents sequentially to avoid rate limits
    for (const doc of documents) {
      const result = await this.processAndStoreDocument(
        doc.buffer,
        doc.filename,
        doc.originalName,
        options
      );
      results.push(result);
    }

    return results;
  }
}