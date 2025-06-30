/**
 * PDF text extraction using unpdf
 * Optimized for Vercel serverless environment
 */
import { extractText } from 'unpdf';

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  error?: string;
}> {
  try {
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    
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