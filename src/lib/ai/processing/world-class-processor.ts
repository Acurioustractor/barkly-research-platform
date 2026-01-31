/**
 * World-Class Document Processor for Barkly Research Platform
 * Designed for reliability, clarity, and Indigenous research protocols
 */

import { prisma } from '@/lib/database-safe';
// Define ProcessingStatus locally as Prisma enum exports are problematic
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';

export interface ProcessingOptions {
  source?: string;
  category?: string;
  tags?: string[];
  enableAI?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface ProcessingResult {
  documentId: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  message: string;
  metrics: {
    chunks: number;
    themes: number;
    quotes: number;
    insights: number;
    processingTime: number;
  };
  error?: string;
}

export class WorldClassProcessor {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CHUNK_SIZE = 1000;
  private readonly AI_TIMEOUT = 30000; // 30 seconds

  /**
   * Process a single document with comprehensive error handling
   */
  async processDocument(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    let documentId: string | undefined;

    try {
      // 1. Validate input
      this.validateFile(file);

      // 2. Create document record
      if (!prisma) {
        throw new Error('Database not available - check DATABASE_URL configuration');
      }

      const document = await prisma.document.create({
        data: {
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          source: options.source || 'upload',
          category: options.category || 'general',
          tags: options.tags ? JSON.stringify(options.tags) : undefined,
          status: 'PROCESSING'
        }
      });

      if (!document) {
        throw new Error('Failed to create document record');
      }

      documentId = document.id;

      // 3. Extract text from PDF
      const buffer = Buffer.from(await file.arrayBuffer());
      const extractionResult = await this.extractText(buffer);

      // 4. Create chunks
      const chunks = await this.createChunks(documentId, extractionResult.text);

      // 5. Analyze with AI (if enabled)
      let analysisResults = { themes: 0, quotes: 0, insights: 0 };
      if (options.enableAI && this.isAIAvailable()) {
        analysisResults = await this.analyzeWithAI(documentId, chunks);
      }

      // 6. Update document as completed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          fullText: extractionResult.text,
          pageCount: extractionResult.pageCount,
          wordCount: extractionResult.wordCount,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      const processingTime = Date.now() - startTime;

      return {
        documentId,
        status: 'COMPLETED',
        progress: 100,
        message: 'Document processed successfully',
        metrics: {
          chunks: chunks.length,
          themes: analysisResults.themes,
          quotes: analysisResults.quotes,
          insights: analysisResults.insights,
          processingTime
        }
      };

    } catch (error) {
      console.error('Document processing failed:', error);

      // Update document status if it was created
      if (documentId && prisma) {
        try {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        } catch (updateError) {
          console.error('Failed to update document status:', updateError);
        }
      }

      return {
        documentId: documentId || '',
        status: 'FAILED',
        progress: 0,
        message: 'Processing failed',
        metrics: {
          chunks: 0,
          themes: 0,
          quotes: 0,
          insights: 0,
          processingTime: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process multiple documents with progress tracking
   */
  async processBatch(
    files: File[],
    options: ProcessingOptions = {},
    onProgress?: (progress: { completed: number; total: number; current?: ProcessingResult }) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.processDocument(file, options);
      results.push(result);

      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: files.length,
          current: result
        });
      }
    }

    return results;
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Extract text from PDF buffer
   */
  private async extractText(buffer: Buffer): Promise<{
    text: string;
    pageCount: number;
    wordCount: number;
  }> {
    try {
      // Use dynamic import to avoid build issues
      const pdfModule: any = await import('pdf-parse');
      const pdfParse = pdfModule.default || pdfModule;
      const pdfData = await pdfParse(buffer);

      if (!pdfData.text || pdfData.text.length < 50) {
        throw new Error('Insufficient text extracted from PDF');
      }

      return {
        text: pdfData.text,
        pageCount: pdfData.numpages || 1,
        wordCount: pdfData.text.split(/\s+/).filter((w: string) => w.length > 0).length
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create document chunks
   */
  private async createChunks(documentId: string, text: string): Promise<Array<{ id: string; text: string }>> {
    const chunks = this.splitIntoChunks(text);

    if (!prisma) {
      throw new Error('Database not available');
    }

    const chunkData = chunks.map((chunk, index) => ({
      documentId,
      chunkIndex: index,
      text: chunk,
      wordCount: chunk.split(/\s+/).length,
      startChar: 0, // Would need proper calculation
      endChar: chunk.length
    }));

    await prisma.documentChunk.createMany({
      data: chunkData
    });

    // Return chunks with IDs
    const storedChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      select: { id: true, text: true },
      orderBy: { chunkIndex: 'asc' }
    });

    return storedChunks;
  }

  /**
   * Split text into manageable chunks
   */
  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
  }

  /**
   * Analyze chunks with AI
   */
  private async analyzeWithAI(
    documentId: string,
    chunks: Array<{ id: string; text: string }>
  ): Promise<{ themes: number; quotes: number; insights: number }> {
    if (!this.isAIAvailable()) {
      return { themes: 0, quotes: 0, insights: 0 };
    }

    try {
      // Import AI service dynamically to avoid issues if not available
      const { analyzeDocumentChunk } = await import('@/lib/ai-service');

      let totalThemes = 0;
      let totalQuotes = 0;
      let totalInsights = 0;

      // Process chunks in small batches to avoid rate limits
      const batchSize = 2; // Reduced for better reliability
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        const batchPromises = batch.map(chunk =>
          Promise.race([
            analyzeDocumentChunk(chunk.text, 'Research Document'),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AI analysis timeout')), this.AI_TIMEOUT)
            )
          ]).catch(error => {
            console.warn(`AI analysis failed for chunk ${chunk.id}:`, error);
            return null;
          })
        );

        const results = await Promise.all(batchPromises);

        for (const result of results) {
          if (result && typeof result === 'object') {
            const typedResult = result as any;
            totalThemes += typedResult.themes?.length || 0;
            totalQuotes += typedResult.quotes?.length || 0;
            totalInsights += typedResult.insights?.length || 0;
          }
        }

        // Add small delay between batches to avoid rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        themes: totalThemes,
        quotes: totalQuotes,
        insights: totalInsights
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      return { themes: 0, quotes: 0, insights: 0 };
    }
  }

  /**
   * Check if AI services are available
   */
  private isAIAvailable(): boolean {
    return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  }
}