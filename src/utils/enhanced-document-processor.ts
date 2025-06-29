/**
 * Enhanced document processor that integrates with database and chunking
 * Supports scalable document processing with persistence
 */

import { prisma } from '@/lib/database-safe';
import { DocumentChunker, type DocumentChunk } from './document-chunker';
import { DocumentProcessor } from './document-processor';
import type { ProcessingStatus } from '@prisma/client';

export interface ProcessingOptions {
  source?: string;
  category?: string;
  tags?: string[];
  chunkSize?: number;
  overlapSize?: number;
  preserveStructure?: boolean;
}

export interface ProcessingResult {
  documentId: string;
  status: ProcessingStatus;
  chunks: number;
  themes: number;
  quotes: number;
  insights: number;
  keywords: number;
  errorMessage?: string;
}

export class EnhancedDocumentProcessor {
  private chunker: DocumentChunker;

  constructor() {
    this.chunker = new DocumentChunker({
      maxChunkSize: 1500,
      overlapSize: 150,
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 200
    });
  }

  /**
   * Process and store a document with full chunking and analysis
   */
  async processAndStoreDocument(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
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

      // Extract content using existing processor
      const extractedContent = await DocumentProcessor.extractTextFromPDF(buffer, filename);

      // Create chunks
      const chunks = this.chunker.chunkDocument(extractedContent.text);

      // Store chunks in database
      await this.storeChunks(documentId, chunks);

      // Store themes, quotes, insights, and keywords
      await Promise.all([
        this.storeThemes(documentId, extractedContent.themes),
        this.storeQuotes(documentId, extractedContent.quotes),
        this.storeInsights(documentId, extractedContent.insights),
        this.storeKeywords(documentId, extractedContent.keywords)
      ]);

      // Update document with processed content and status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          fullText: extractedContent.text,
          pageCount: extractedContent.metadata.pageCount,
          wordCount: extractedContent.metadata.wordCount,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      return {
        documentId,
        status: 'COMPLETED',
        chunks: chunks.length,
        themes: extractedContent.themes.length,
        quotes: extractedContent.quotes.length,
        insights: extractedContent.insights.length,
        keywords: extractedContent.keywords.length
      };

    } catch (error) {
      console.error('Error processing document:', error);

      // Update document status to failed if it was created
      if (documentId) {
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
   * Process multiple documents in batch
   */
  async processBatchDocuments(
    documents: Array<{ buffer: Buffer; filename: string; originalName: string }>,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    const results = [];

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

  /**
   * Store document chunks in database
   */
  private async storeChunks(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    const chunkData = chunks.map(chunk => ({
      documentId,
      chunkIndex: chunk.index,
      startPage: chunk.startPage,
      endPage: chunk.endPage,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
      text: chunk.text,
      wordCount: chunk.wordCount,
      topics: chunk.metadata ? JSON.stringify(chunk.metadata) : undefined
    }));

    await prisma.documentChunk.createMany({
      data: chunkData
    });
  }

  /**
   * Store document themes
   */
  private async storeThemes(documentId: string, themes: string[]): Promise<void> {
    const themeData = themes.map(theme => ({
      documentId,
      theme,
      confidence: 0.8 // Default confidence
    }));

    await prisma.documentTheme.createMany({
      data: themeData
    });
  }

  /**
   * Store document quotes
   */
  private async storeQuotes(documentId: string, quotes: any[]): Promise<void> {
    const quoteData = quotes.map(quote => ({
      documentId,
      text: quote.text,
      context: quote.context,
      speaker: quote.speaker,
      page: quote.page,
      confidence: quote.confidence,
      category: this.categorizeQuote(quote.text)
    }));

    await prisma.documentQuote.createMany({
      data: quoteData
    });
  }

  /**
   * Store document insights
   */
  private async storeInsights(documentId: string, insights: string[]): Promise<void> {
    const insightData = insights.map(insight => ({
      documentId,
      insight,
      type: this.categorizeInsight(insight),
      confidence: 0.7
    }));

    await prisma.documentInsight.createMany({
      data: insightData
    });
  }

  /**
   * Store document keywords
   */
  private async storeKeywords(documentId: string, keywords: string[]): Promise<void> {
    const keywordData = keywords.map((keyword, index) => ({
      documentId,
      keyword,
      frequency: 1, // Would need to calculate actual frequency
      relevance: Math.max(0.1, 1 - (index * 0.05)), // Decreasing relevance by order
      category: this.categorizeKeyword(keyword)
    }));

    await prisma.documentKeyword.createMany({
      data: keywordData
    });
  }

  /**
   * Categorize quotes based on content
   */
  private categorizeQuote(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('youth') || lowerText.includes('young') || lowerText.includes('student')) {
      return 'youth_voice';
    } else if (lowerText.includes('challenge') || lowerText.includes('problem') || lowerText.includes('difficult')) {
      return 'community_concern';
    } else if (lowerText.includes('success') || lowerText.includes('achievement') || lowerText.includes('proud')) {
      return 'success_story';
    }
    
    return 'general';
  }

  /**
   * Categorize insights based on content
   */
  private categorizeInsight(insight: string): string {
    const lowerInsight = insight.toLowerCase();
    
    if (lowerInsight.includes('gap') || lowerInsight.includes('need') || lowerInsight.includes('lack')) {
      return 'gap';
    } else if (lowerInsight.includes('pattern') || lowerInsight.includes('trend')) {
      return 'pattern';
    } else if (lowerInsight.includes('opportunity') || lowerInsight.includes('potential')) {
      return 'opportunity';
    } else if (lowerInsight.includes('challenge') || lowerInsight.includes('barrier')) {
      return 'challenge';
    }
    
    return 'observation';
  }

  /**
   * Categorize keywords based on content
   */
  private categorizeKeyword(keyword: string): string {
    const communityTerms = ['youth', 'community', 'culture', 'traditional', 'elder', 'family'];
    const technicalTerms = ['program', 'service', 'intervention', 'evaluation', 'assessment'];
    const emotionalTerms = ['feel', 'emotion', 'happy', 'sad', 'angry', 'proud', 'frustrated'];
    
    if (communityTerms.includes(keyword.toLowerCase())) {
      return 'community_term';
    } else if (technicalTerms.includes(keyword.toLowerCase())) {
      return 'technical_term';
    } else if (emotionalTerms.includes(keyword.toLowerCase())) {
      return 'emotional_term';
    }
    
    return 'general_term';
  }

  /**
   * Retrieve document with all related data
   */
  async getDocument(documentId: string) {
    return await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' }
        },
        themes: true,
        quotes: {
          orderBy: { confidence: 'desc' }
        },
        insights: true,
        keywords: {
          orderBy: { relevance: 'desc' }
        }
      }
    });
  }

  /**
   * Search documents by various criteria
   */
  async searchDocuments(query: {
    text?: string;
    theme?: string;
    category?: string;
    source?: string;
    tags?: string[];
    status?: ProcessingStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.source) where.source = query.source;
    
    if (query.text) {
      where.OR = [
        { originalName: { contains: query.text } },
        { fullText: { contains: query.text } }
      ];
    }

    if (query.theme) {
      where.themes = {
        some: {
          theme: { contains: query.theme }
        }
      };
    }

    return await prisma.document.findMany({
      where,
      include: {
        themes: true,
        _count: {
          select: {
            chunks: true,
            quotes: true,
            insights: true,
            keywords: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0
    });
  }

  /**
   * Get document chunks for specific processing
   */
  async getDocumentChunks(documentId: string, options?: {
    limit?: number;
    offset?: number;
    contentType?: string;
  }) {
    return await prisma.documentChunk.findMany({
      where: { 
        documentId
      },
      orderBy: { chunkIndex: 'asc' },
      take: options?.limit,
      skip: options?.offset
    });
  }

  /**
   * Create a document collection
   */
  async createCollection(name: string, description?: string, tags?: string[], isPublic: boolean = false) {
    return await prisma.documentCollection.create({
      data: {
        name,
        description,
        tags: tags ? JSON.stringify(tags) : undefined,
        isPublic
      }
    });
  }

  /**
   * Add documents to a collection
   */
  async addDocumentsToCollection(collectionId: string, documentIds: string[]) {
    const data = documentIds.map((documentId, index) => ({
      collectionId,
      documentId,
      order: index
    }));

    await prisma.documentInCollection.createMany({
      data
    });
  }
}