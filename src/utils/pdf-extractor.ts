/**
 * PDF text extraction using unpdf
 * Optimized for Vercel serverless environment
 */
import { extractText } from 'unpdf';

export class PDFExtractor {
  private buffer: Buffer;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  async extractText(): Promise<string> {
    const result = await extractTextFromPDF(this.buffer);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.text;
  }

  async getMetadata(): Promise<{ pageCount: number; wordCount: number }> {
    const result = await extractTextFromPDF(this.buffer);
    if (result.error) {
      throw new Error(result.error);
    }
    const wordCount = result.text.split(/\s+/).filter(word => word.length > 0).length;
    return {
      pageCount: result.pageCount,
      wordCount
    };
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  error?: string;
}> {
  try {
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Extract text from PDF - this also gives us totalPages
    const result = await extractText(uint8Array, {
      mergePages: true // Merge all pages into single text
    });
    
    return {
      text: result.text || '',
      pageCount: result.totalPages || 0,
      error: undefined
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'PDF processing failed'
    };
  }
}