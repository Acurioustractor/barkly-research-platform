/**
 * Dead Simple Document Processor
 * No bullshit, no over-engineering, just works
 */

import { prisma } from '@/lib/database-safe';

export interface SimpleResult {
  success: boolean;
  documentId?: string;
  error?: string;
  chunks?: number;
  text?: string;
}

export class SimpleProcessor {
  
  async processFile(file: File): Promise<SimpleResult> {
    try {
      // 1. Basic validation
      if (!file || file.type !== 'application/pdf') {
        return { success: false, error: 'Only PDF files allowed' };
      }
      
      if (file.size > 50 * 1024 * 1024) {
        return { success: false, error: 'File too large (max 50MB)' };
      }

      // 2. Extract text - keep it simple
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await this.extractText(buffer);
      
      if (!text || text.length < 50) {
        return { success: false, error: 'Could not extract text from PDF' };
      }

      // 3. Store in database - minimal fields
      const doc = await prisma?.document.create({
        data: {
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          fullText: text,
          wordCount: text.split(/\s+/).length,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      if (!doc) {
        return { success: false, error: 'Database error' };
      }

      // 4. Create simple chunks
      const chunks = this.simpleChunk(text);
      await this.storeChunks(doc.id, chunks);

      return {
        success: true,
        documentId: doc.id,
        chunks: chunks.length,
        text: text.substring(0, 200) + '...'
      };

    } catch (error) {
      console.error('Processing failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async extractText(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (error) {
      throw new Error('PDF extraction failed');
    }
  }

  private simpleChunk(text: string): string[] {
    // Split by paragraphs, keep it simple
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // If paragraphs are too long, split by sentences
    const chunks: string[] = [];
    for (const para of paragraphs) {
      if (para.length <= 1000) {
        chunks.push(para.trim());
      } else {
        const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 20);
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > 1000 && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
          }
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }
    }
    
    return chunks.filter(chunk => chunk.length > 50);
  }

  private async storeChunks(documentId: string, chunks: string[]): Promise<void> {
    if (!prisma) return;
    
    const chunkData = chunks.map((text, index) => ({
      documentId,
      chunkIndex: index,
      text,
      wordCount: text.split(/\s+/).length,
      startChar: 0,
      endChar: text.length
    }));

    await prisma.documentChunk.createMany({ data: chunkData });
  }
}