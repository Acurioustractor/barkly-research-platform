/**
 * Enhanced DOCX text extraction with multiple fallback methods
 * Handles complex DOCX documents with tables, images, and formatting
 */
import mammoth from 'mammoth';

export interface DOCXExtractionResult {
  text: string;
  wordCount: number;
  method: 'mammoth' | 'raw-xml' | 'buffer-parse' | 'failed';
  confidence: number;
  warnings: string[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
  };
  formatting?: {
    headers: string[];
    tables: string[][];
    lists: string[];
    images: number;
  };
}

export class EnhancedDOCXExtractor {
  private buffer: Buffer;
  
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  /**
   * Extract text using multiple methods with comprehensive fallbacks
   */
  async extractText(): Promise<DOCXExtractionResult> {
    const warnings: string[] = [];
    const fileSize = this.buffer.length;
    
    console.log(`[DOCXExtractor] Processing ${fileSize} byte DOCX document`);
    
    // Method 1: Mammoth.js (best for modern DOCX)
    try {
      console.log(`[DOCXExtractor] Attempting mammoth extraction`);
      const result = await this.extractWithMammoth();
      
      if (result.text && result.text.length > 100) {
        console.log(`[DOCXExtractor] Mammoth extraction succeeded: ${result.text.length} chars`);
        return { 
          ...result, 
          method: 'mammoth', 
          warnings: [...warnings, 'Successfully extracted with mammoth.js']
        };
      } else if (result.text && result.text.length > 20) {
        warnings.push('Mammoth extraction produced limited content');
      }
    } catch (error) {
      console.error(`[DOCXExtractor] Mammoth extraction failed:`, error);
      warnings.push(`Mammoth extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method 2: Raw XML parsing (fallback for corrupted files)
    try {
      console.log(`[DOCXExtractor] Attempting raw XML extraction`);
      const result = await this.extractWithRawXML();
      
      if (result.text && result.text.length > 50) {
        console.log(`[DOCXExtractor] Raw XML extraction succeeded: ${result.text.length} chars`);
        return { 
          ...result, 
          method: 'raw-xml', 
          warnings: [...warnings, 'Extracted using raw XML parsing']
        };
      }
    } catch (error) {
      console.error(`[DOCXExtractor] Raw XML extraction failed:`, error);
      warnings.push(`Raw XML extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Method 3: Buffer content analysis (last resort)
    try {
      console.log(`[DOCXExtractor] Attempting buffer content analysis`);
      const result = await this.extractWithBufferAnalysis();
      
      if (result.text && result.text.length > 20) {
        console.log(`[DOCXExtractor] Buffer analysis succeeded: ${result.text.length} chars`);
        return { 
          ...result, 
          method: 'buffer-parse', 
          warnings: [...warnings, 'Extracted using buffer content analysis']
        };
      }
    } catch (error) {
      console.error(`[DOCXExtractor] Buffer analysis failed:`, error);
      warnings.push(`Buffer analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // All methods failed
    console.error(`[DOCXExtractor] All extraction methods failed for ${fileSize} byte file`);
    return {
      text: '',
      wordCount: 0,
      method: 'failed',
      confidence: 0,
      warnings: [...warnings, 'All extraction methods failed'],
      metadata: {}
    };
  }

  /**
   * Primary extraction method using mammoth.js
   */
  private async extractWithMammoth(): Promise<Partial<DOCXExtractionResult>> {
    const options = {
      styleMap: [
        // Convert headers to markdown-style
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        // Convert lists
        "p[style-name='List Paragraph'] => ul > li:fresh",
        // Preserve tables
        "table => table:fresh",
        // Convert bold and italic
        "b => strong",
        "i => em"
      ],
      convertImage: mammoth.images.imgElement(function(image) {
        // Convert images to descriptive text
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer,
            alt: "[IMAGE: Document contains visual content]"
          };
        });
      })
    };

    const result = await mammoth.extractRawText(this.buffer, options);
    const htmlResult = await mammoth.convertToHtml(this.buffer, options);
    
    // Parse HTML for structure
    const formatting = this.parseHTMLStructure(htmlResult.value);
    
    // Clean and enhance the extracted text
    const cleanedText = this.cleanExtractedText(result.value);
    
    const warnings = [];
    if (result.messages && result.messages.length > 0) {
      warnings.push(`Mammoth warnings: ${result.messages.map(m => m.message).join(', ')}`);
    }

    return {
      text: cleanedText,
      wordCount: this.countWords(cleanedText),
      confidence: this.calculateConfidence(cleanedText, formatting),
      warnings: warnings,
      formatting: formatting,
      metadata: await this.extractMetadata()
    };
  }

  /**
   * Fallback method using raw XML parsing
   */
  private async extractWithRawXML(): Promise<Partial<DOCXExtractionResult>> {
    const JSZip = require('jszip');
    
    try {
      const zip = await JSZip.loadAsync(this.buffer);
      
      // Extract main document
      const docFile = zip.file('word/document.xml');
      if (!docFile) {
        throw new Error('No word/document.xml found');
      }
      
      const docXML = await docFile.async('text');
      
      // Extract text content from XML
      const textContent = this.extractTextFromXML(docXML);
      
      // Try to extract headers/footers
      let headerFooterText = '';
      const headerFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('word/header') || name.startsWith('word/footer')
      );
      
      for (const headerFile of headerFiles) {
        try {
          const headerXML = await zip.file(headerFile)?.async('text');
          if (headerXML) {
            headerFooterText += this.extractTextFromXML(headerXML) + '\n';
          }
        } catch (e) {
          console.warn(`Failed to extract ${headerFile}:`, e);
        }
      }
      
      const fullText = (textContent + '\n' + headerFooterText).trim();
      const cleanedText = this.cleanExtractedText(fullText);
      
      return {
        text: cleanedText,
        wordCount: this.countWords(cleanedText),
        confidence: Math.min(this.calculateConfidence(cleanedText), 0.8), // Lower confidence for XML method
        warnings: ['Extracted using raw XML parsing - formatting may be limited'],
        metadata: {}
      };
    } catch (error) {
      throw new Error(`Raw XML extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Last resort: buffer content analysis
   */
  private async extractWithBufferAnalysis(): Promise<Partial<DOCXExtractionResult>> {
    // Convert buffer to string and look for readable text patterns
    const bufferString = this.buffer.toString('utf8');
    
    // Look for common DOCX text patterns
    const textPatterns = [
      // Look for text between XML tags
      /<w:t[^>]*>([^<]+)<\/w:t>/g,
      // Look for plain text sections
      /[a-zA-Z]{3,}[\s\w]*[.!?]/g,
      // Look for common document words
      /\b(the|and|for|with|from|this|that|will|would|could|should)\b[\s\w]{10,}/g
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = bufferString.match(pattern);
      if (matches) {
        extractedText += matches.join(' ') + ' ';
      }
    }
    
    // Clean up the extracted text
    const cleanedText = this.cleanExtractedText(extractedText);
    
    if (cleanedText.length < 20) {
      throw new Error('Insufficient text content found in buffer analysis');
    }
    
    return {
      text: cleanedText,
      wordCount: this.countWords(cleanedText),
      confidence: Math.min(this.calculateConfidence(cleanedText), 0.6), // Lowest confidence
      warnings: ['Extracted using buffer analysis - content may be incomplete'],
      metadata: {}
    };
  }

  /**
   * Extract text content from XML string
   */
  private extractTextFromXML(xml: string): string {
    // Remove XML tags and extract text content
    return xml
      .replace(/<[^>]*>/g, ' ') // Remove all XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Parse HTML structure for formatting information
   */
  private parseHTMLStructure(html: string): any {
    const headers: string[] = [];
    const tables: string[][] = [];
    const lists: string[] = [];
    let imageCount = 0;

    // Extract headers
    const headerMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g);
    if (headerMatches) {
      headers.push(...headerMatches.map(h => h.replace(/<[^>]*>/g, '').trim()));
    }

    // Count images
    const imageMatches = html.match(/<img[^>]*>/g);
    if (imageMatches) {
      imageCount = imageMatches.length;
    }

    // Extract list items
    const listMatches = html.match(/<li[^>]*>([^<]+)<\/li>/g);
    if (listMatches) {
      lists.push(...listMatches.map(li => li.replace(/<[^>]*>/g, '').trim()));
    }

    return {
      headers,
      tables,
      lists,
      images: imageCount
    };
  }

  /**
   * Clean extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/\s{2,}/g, ' ') // Normalize spaces
      .replace(/[^\x20-\x7E\n\t]/g, '') // Remove non-printable characters except newlines and tabs
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate extraction confidence based on content quality
   */
  private calculateConfidence(text: string, formatting?: any): number {
    let confidence = 0;
    
    // Base confidence from text length
    if (text.length > 1000) confidence += 0.4;
    else if (text.length > 500) confidence += 0.3;
    else if (text.length > 100) confidence += 0.2;
    else if (text.length > 20) confidence += 0.1;
    
    // Word count factor
    const wordCount = this.countWords(text);
    if (wordCount > 200) confidence += 0.3;
    else if (wordCount > 100) confidence += 0.2;
    else if (wordCount > 50) confidence += 0.1;
    
    // Structural elements boost confidence
    if (formatting) {
      if (formatting.headers.length > 0) confidence += 0.1;
      if (formatting.lists.length > 0) confidence += 0.1;
      if (formatting.tables.length > 0) confidence += 0.1;
    }
    
    // Check for meaningful content patterns
    const meaningfulPatterns = [
      /\b(community|service|program|initiative|development|support)\b/gi,
      /\b(Barkly|Tennant Creek|youth|training|education)\b/gi,
      /\b(outcome|indicator|strategy|plan|framework)\b/gi
    ];
    
    for (const pattern of meaningfulPatterns) {
      if (pattern.test(text)) {
        confidence += 0.05;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract metadata from DOCX
   */
  private async extractMetadata(): Promise<any> {
    try {
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(this.buffer);
      
      // Try to extract core properties
      const corePropsFile = zip.file('docProps/core.xml');
      if (corePropsFile) {
        const corePropsXML = await corePropsFile.async('text');
        return this.parseMetadataXML(corePropsXML);
      }
      
      return {};
    } catch (error) {
      console.warn('Failed to extract metadata:', error);
      return {};
    }
  }

  /**
   * Parse metadata from core properties XML
   */
  private parseMetadataXML(xml: string): any {
    const metadata: any = {};
    
    const patterns = {
      title: /<dc:title>([^<]+)<\/dc:title>/,
      author: /<dc:creator>([^<]+)<\/dc:creator>/,
      subject: /<dc:subject>([^<]+)<\/dc:subject>/,
      keywords: /<cp:keywords>([^<]+)<\/cp:keywords>/,
      creationDate: /<dcterms:created[^>]*>([^<]+)<\/dcterms:created>/,
      modificationDate: /<dcterms:modified[^>]*>([^<]+)<\/dcterms:modified>/
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = xml.match(pattern);
      if (match) {
        metadata[key] = key.includes('Date') ? new Date(match[1]) : match[1];
      }
    }
    
    return metadata;
  }
}

/**
 * Helper function to extract text from DOCX buffer
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<DOCXExtractionResult> {
  const extractor = new EnhancedDOCXExtractor(buffer);
  return await extractor.extractText();
}