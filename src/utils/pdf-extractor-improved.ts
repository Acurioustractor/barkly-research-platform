/**
 * Improved PDF text extraction with multiple fallback methods
 * Handles various PDF types including scanned documents
 */
import { extractText } from 'unpdf';
/// <reference types="node" />

export interface ExtractionResult {
  text: string;
  pageCount: number;
  method: 'unpdf' | 'pdf-parse' | 'buffer-parse' | 'ocr' | 'failed';
  confidence: number;
  warnings: string[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export class ImprovedPDFExtractor {
  private buffer: Buffer;
  
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  /**
   * Extract text using multiple methods with fallbacks
   */
  async extractText(): Promise<ExtractionResult> {
    const warnings: string[] = [];
    
    // Method 1: Try unpdf (primary method)
    try {
      const result = await this.extractWithUnpdf();
      if (result.text && result.text.length > 50) {
        return { ...result, method: 'unpdf', warnings };
      }
      warnings.push('unpdf extracted minimal text');
    } catch (error) {
      warnings.push(`unpdf failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method 2: Try pdf-parse (more robust for complex PDFs)
    try {
      const result = await this.extractWithPdfParse();
      if (result.text && result.text.length > 50) {
        return { ...result, method: 'pdf-parse', warnings };
      }
      warnings.push('pdf-parse extracted minimal text');
    } catch (error) {
      warnings.push(`pdf-parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method 3: Try manual buffer parsing (last resort for simple PDFs)
    try {
      const result = await this.extractWithBufferParsing();
      if (result.text && result.text.length > 50) {
        return { ...result, method: 'buffer-parse', warnings };
      }
      warnings.push('buffer parsing extracted minimal text');
    } catch (error) {
      warnings.push(`buffer parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method 4: Check if PDF might be scanned (image-based)
    const isLikelyScanned = await this.checkIfScanned();
    if (isLikelyScanned) {
      warnings.push('PDF appears to be scanned/image-based. OCR would be needed.');
      return {
        text: '',
        pageCount: 0,
        method: 'failed',
        confidence: 0,
        warnings: [...warnings, 'Scanned PDF detected - OCR required but not available in current environment']
      };
    }

    // All methods failed
    return {
      text: '',
      pageCount: 0,
      method: 'failed',
      confidence: 0,
      warnings
    };
  }

  /**
   * Method 1: Extract using unpdf library
   */
  private async extractWithUnpdf(): Promise<Omit<ExtractionResult, 'method' | 'warnings'>> {
    const uint8Array = new Uint8Array(this.buffer);
    
    const result = await extractText(uint8Array, {
      mergePages: true
    });

    const text = result.text || '';
    const confidence = this.calculateConfidence(text, result.totalPages || 0);

    return {
      text: this.cleanExtractedText(text),
      pageCount: result.totalPages || 0,
      confidence
    };
  }

  /**
   * Method 2: Extract using pdf-parse library
   */
  private async extractWithPdfParse(): Promise<Omit<ExtractionResult, 'method' | 'warnings'>> {
    try {
      // Dynamic import to handle optional dependency
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(this.buffer);

      const confidence = this.calculateConfidence(data.text, data.numpages);

      return {
        text: this.cleanExtractedText(data.text),
        pageCount: data.numpages,
        confidence,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          keywords: data.info?.Keywords,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
        }
      };
    } catch {
      // If pdf-parse is not installed, throw error to try next method
      throw new Error('pdf-parse not available');
    }
  }

  /**
   * Method 3: Manual buffer parsing (improved version)
   */
  private async extractWithBufferParsing(): Promise<Omit<ExtractionResult, 'method' | 'warnings'>> {
    const text = this.extractTextFromBuffer();
    const pageCount = this.estimatePageCount();
    const confidence = this.calculateConfidence(text, pageCount);

    return {
      text: this.cleanExtractedText(text),
      pageCount,
      confidence
    };
  }

  /**
   * Improved buffer text extraction
   */
  private extractTextFromBuffer(): string {
    const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 1000000)); // Limit to 1MB for performance
    const texts: string[] = [];

    // Method 1: Extract text between parentheses (common in PDFs)
    const parenMatches = str.match(/\(([^)]+)\)/g) || [];
    texts.push(...parenMatches.map(match => match.slice(1, -1)));

    // Method 2: Extract text between BT and ET markers (PDF text objects)
    const btEtMatches = str.match(/BT\s*([\s\S]*?)\s*ET/g) || [];
    btEtMatches.forEach(match => {
      const tjMatches = match.match(/\((.*?)\)\s*Tj/g) || [];
      texts.push(...tjMatches.map(m => m.match(/\((.*?)\)/)?.[1] || ''));
    });

    // Method 3: Extract hex strings (another PDF text encoding)
    const hexMatches = str.match(/<([0-9A-Fa-f]+)>\s*Tj/g) || [];
    hexMatches.forEach(match => {
      const hex = match.match(/<([0-9A-Fa-f]+)>/)?.[1];
      if (hex) {
        try {
          const text = Buffer.from(hex, 'hex').toString('utf8');
          if (this.isValidText(text)) {
            texts.push(text);
          }
        } catch {}
      }
    });

    // Filter and clean extracted texts
    return texts
      .filter(text => text && text.length > 2 && this.isValidText(text))
      .join(' ')
      .trim();
  }

  /**
   * Check if text is valid (not binary garbage)
   */
  private isValidText(text: string): boolean {
    // Check if text has reasonable amount of printable characters
    const printableChars = text.match(/[\x20-\x7E]/g)?.length || 0;
    const totalChars = text.length;
    return totalChars > 0 && (printableChars / totalChars) > 0.8;
  }

  /**
   * Estimate page count from buffer
   */
  private estimatePageCount(): number {
    const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 100000));
    
    // Look for page objects
    const pageMatches = str.match(/\/Type\s*\/Page[^s]/g) || [];
    if (pageMatches.length > 0) {
      return pageMatches.length;
    }

    // Fallback: estimate based on file size (rough estimate)
    const avgBytesPerPage = 3000; // Rough average
    return Math.max(1, Math.round(this.buffer.length / avgBytesPerPage));
  }

  /**
   * Check if PDF is likely scanned (image-based)
   */
  private async checkIfScanned(): Promise<boolean> {
    const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 50000));
    
    // Check for image streams
    const imageStreamCount = (str.match(/\/Image/g) || []).length;
    const textStreamCount = (str.match(/BT[\s\S]*?ET/g) || []).length;
    
    // If mostly images and very little text, likely scanned
    return imageStreamCount > 5 && textStreamCount < 2;
  }

  /**
   * Calculate confidence score for extracted text
   */
  private calculateConfidence(text: string, pageCount: number): number {
    if (!text || text.length === 0) return 0;

    let confidence = 0;

    // Factor 1: Text length relative to pages
    const avgCharsPerPage = text.length / Math.max(1, pageCount);
    if (avgCharsPerPage > 500) confidence += 0.3;
    else if (avgCharsPerPage > 200) confidence += 0.2;
    else if (avgCharsPerPage > 50) confidence += 0.1;

    // Factor 2: Word count
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
    if (wordCount > 100) confidence += 0.3;
    else if (wordCount > 50) confidence += 0.2;
    else if (wordCount > 20) confidence += 0.1;

    // Factor 3: Sentence structure (has periods, capitals)
    const sentences = text.match(/[.!?]+/g)?.length || 0;
    const capitals = text.match(/[A-Z]/g)?.length || 0;
    if (sentences > 5 && capitals > 10) confidence += 0.2;

    // Factor 4: Language patterns (common English words)
    const commonWords = ['the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'with'];
    const lowerText = text.toLowerCase();
    const commonWordCount = commonWords.filter(word => 
      lowerText.includes(` ${word} `) || lowerText.includes(`${word} `) || lowerText.includes(` ${word}`)
    ).length;
    if (commonWordCount >= 7) confidence += 0.2;
    else if (commonWordCount >= 4) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Clean extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\w)(\d)/g, '$1 $2') // Add space between letters and numbers
      .replace(/(\d)(\w)/g, '$1 $2') // Add space between numbers and letters
      // Remove repeated spaces
      .replace(/ +/g, ' ')
      .trim();
  }

  /**
   * Get detailed metadata about the PDF
   */
  async getDetailedMetadata(): Promise<{
    basic: ExtractionResult;
    advanced: {
      isEncrypted: boolean;
      isScanned: boolean;
      hasForm: boolean;
      compressionType?: string;
      pdfVersion?: string;
    };
  }> {
    const basic = await this.extractText();
    const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 10000));

    const advanced = {
      isEncrypted: str.includes('/Encrypt'),
      isScanned: await this.checkIfScanned(),
      hasForm: str.includes('/AcroForm'),
      compressionType: str.includes('/FlateDecode') ? 'FlateDecode' : 
                      str.includes('/DCTDecode') ? 'DCTDecode' : undefined,
      pdfVersion: str.match(/%PDF-(\d\.\d)/)?.[1]
    };

    return { basic, advanced };
  }
}

/**
 * Factory function for easy use
 */
export async function extractTextFromPDFImproved(
  buffer: Buffer
): Promise<ExtractionResult> {
  const extractor = new ImprovedPDFExtractor(buffer);
  return await extractor.extractText();
}

/**
 * Batch processing with progress callback
 */
export async function extractTextFromMultiplePDFs(
  buffers: { buffer: Buffer; filename: string }[],
  onProgress?: (filename: string, index: number, total: number) => void
): Promise<Map<string, ExtractionResult>> {
  const results = new Map<string, ExtractionResult>();

  for (let i = 0; i < buffers.length; i++) {
    const item = buffers[i];
    if (!item) continue;
    
    const { buffer, filename } = item;
    if (onProgress) {
      onProgress(filename, i + 1, buffers.length);
    }

    try {
      const extractor = new ImprovedPDFExtractor(buffer);
      const result = await extractor.extractText();
      results.set(filename, result);
    } catch (error) {
      results.set(filename, {
        text: '',
        pageCount: 0,
        method: 'failed',
        confidence: 0,
        warnings: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }

  return results;
}