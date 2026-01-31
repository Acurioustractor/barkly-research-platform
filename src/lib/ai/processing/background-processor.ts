/**
 * Background processing service for handling large document processing
 * Uses streaming and chunked processing to handle large PDFs
 */

import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
import { prisma } from '@/lib/database-safe';

export interface ProcessingProgress {
  documentId: string;
  status: 'starting' | 'extracting' | 'analyzing' | 'completing' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
}

export class BackgroundProcessor {
  private progressCallbacks: Map<string, (progress: ProcessingProgress) => void> = new Map();

  /**
   * Register a progress callback for a specific document
   */
  onProgress(documentId: string, callback: (progress: ProcessingProgress) => void) {
    this.progressCallbacks.set(documentId, callback);
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(documentId: string) {
    this.progressCallbacks.delete(documentId);
  }

  /**
   * Send progress update
   */
  private sendProgress(documentId: string, status: ProcessingProgress['status'], progress: number, message: string, error?: string) {
    const progressData: ProcessingProgress = {
      documentId,
      status,
      progress,
      message,
      error
    };

    const callback = this.progressCallbacks.get(documentId);
    if (callback) {
      callback(progressData);
    }

    console.log(`[BackgroundProcessor] ${documentId}: ${status} - ${message} (${progress}%)`);
  }

  /**
   * Process a document with chunked approach and progress updates
   */
  async processDocument(documentId: string, fileBuffer: Buffer): Promise<void> {
    try {
      this.sendProgress(documentId, 'starting', 0, 'Initializing PDF processing...');

      // Update document status to processing
      if (prisma) {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'PROCESSING' }
        });
      }

      this.sendProgress(documentId, 'extracting', 10, 'Analyzing PDF structure...');

      // Create PDF extractor
      const extractor = new ImprovedPDFExtractor(fileBuffer);

      this.sendProgress(documentId, 'extracting', 25, 'Extracting text content...');

      // Extract text with progress monitoring
      const extractedData = await this.extractWithProgress(extractor, documentId);

      this.sendProgress(documentId, 'analyzing', 60, 'Processing extracted content...');

      // Calculate statistics
      const wordCount = extractedData.text.split(/\s+/).filter((word: string) => word.length > 0).length;
      const pageCount = extractedData.pageCount || 1;

      this.sendProgress(documentId, 'analyzing', 80, 'Generating insights and themes...');

      // Simulate additional AI processing (themes, insights, etc.)
      await this.simulateAIProcessing(documentId);

      this.sendProgress(documentId, 'completing', 95, 'Finalizing document processing...');

      // Update document with results
      if (prisma) {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            wordCount,
            pageCount,
            fullText: extractedData.text.substring(0, 100000), // Limit text size
            status: 'COMPLETED',
            processedAt: new Date(),
          }
        });
      }

      this.sendProgress(documentId, 'completed', 100, 'Document processing completed successfully');

    } catch (error) {
      console.error(`[BackgroundProcessor] Processing failed for ${documentId}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

      // Update document with error status
      if (prisma) {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'FAILED',
            errorMessage,
            processedAt: new Date(),
          }
        });
      }

      this.sendProgress(documentId, 'failed', 0, 'Document processing failed', errorMessage);
    } finally {
      // Clean up progress callback
      this.removeProgressCallback(documentId);
    }
  }

  /**
   * Extract text with progress updates
   */
  private async extractWithProgress(extractor: ImprovedPDFExtractor, documentId: string) {
    // Create a timeout promise that updates progress
    const extractionPromise = extractor.extractText();
    
    // Monitor progress with periodic updates
    const progressMonitor = setInterval(() => {
      // Send periodic progress updates during extraction
      this.sendProgress(documentId, 'extracting', 
        Math.min(50, 25 + Math.random() * 25), 
        'Extracting text from PDF pages...'
      );
    }, 5000);

    try {
      // Use a more conservative timeout for serverless
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF extraction timeout - document too complex for serverless processing')), 45000) // 45 seconds
      );

      const result = await Promise.race([extractionPromise, timeoutPromise]);
      clearInterval(progressMonitor);
      return result as any;

    } catch (error) {
      clearInterval(progressMonitor);
      throw error;
    }
  }

  /**
   * Simulate AI processing for themes, insights, etc.
   */
  private async simulateAIProcessing(documentId: string): Promise<void> {
    // Simulate theme extraction
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.sendProgress(documentId, 'analyzing', 85, 'Extracting themes and topics...');

    // Simulate insight generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.sendProgress(documentId, 'analyzing', 90, 'Generating insights and summaries...');

    // In a real implementation, you would:
    // 1. Send text to AI services for analysis
    // 2. Extract themes, quotes, insights
    // 3. Generate summaries
    // 4. Store results in database
  }

  /**
   * Process multiple documents in queue
   */
  async processQueue(): Promise<void> {
    // Find documents pending processing
    if (!prisma) {
      console.log('[BackgroundProcessor] Database not available');
      return;
    }
    
    const pendingDocuments = await prisma.document.findMany({
      where: { status: 'PENDING' },
      orderBy: { uploadedAt: 'asc' },
      take: 5 // Process up to 5 at a time
    });

    console.log(`[BackgroundProcessor] Found ${pendingDocuments.length} documents to process`);

    for (const document of pendingDocuments) {
      console.log(`[BackgroundProcessor] Processing document ${document.id}: ${document.originalName}`);
      
      try {
        // In a real implementation, you would retrieve the file from storage
        // For now, we'll simulate with an empty buffer
        const fileBuffer = Buffer.from(''); // Placeholder
        
        await this.processDocument(document.id, fileBuffer);
      } catch (error) {
        console.error(`[BackgroundProcessor] Failed to process ${document.id}:`, error);
      }
    }
  }
}

// Export singleton instance
export const backgroundProcessor = new BackgroundProcessor();