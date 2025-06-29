/**
 * Document chunking utilities for breaking large documents into manageable pieces
 * Supports various chunking strategies for different processing needs
 */

export interface ChunkOptions {
  maxChunkSize?: number;      // Maximum characters per chunk
  overlapSize?: number;       // Characters to overlap between chunks
  preserveSentences?: boolean; // Try to preserve sentence boundaries
  preserveParagraphs?: boolean; // Try to preserve paragraph boundaries
  minChunkSize?: number;      // Minimum characters per chunk
}

export interface DocumentChunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  startPage?: number;
  endPage?: number;
  wordCount: number;
  metadata?: {
    hasHeaders?: boolean;
    hasBulletPoints?: boolean;
    hasQuotes?: boolean;
    contentType?: 'narrative' | 'list' | 'table' | 'mixed';
  };
}

export class DocumentChunker {
  private options: Required<ChunkOptions>;

  constructor(options: ChunkOptions = {}) {
    this.options = {
      maxChunkSize: 1500,      // ~300-400 words
      overlapSize: 150,        // ~30-40 words overlap
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 200,       // ~40-50 words minimum
      ...options
    };
  }

  /**
   * Chunk document text into manageable pieces
   */
  chunkDocument(text: string, pageBreaks?: number[]): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      const chunk = this.extractChunk(text, currentPosition, pageBreaks);
      
      if (chunk.text.trim().length >= this.options.minChunkSize) {
        chunks.push({
          ...chunk,
          index: chunkIndex++
        });
      }

      // Move to next chunk position with overlap
      currentPosition = chunk.endChar - this.options.overlapSize;
      
      // Ensure we don't go backwards
      if (currentPosition <= chunk.startChar) {
        currentPosition = chunk.endChar;
      }
    }

    return chunks;
  }

  /**
   * Extract a single chunk from the document
   */
  private extractChunk(text: string, startPos: number, pageBreaks?: number[]): Omit<DocumentChunk, 'index'> {
    const maxEndPos = Math.min(startPos + this.options.maxChunkSize, text.length);
    let endPos = maxEndPos;

    // Try to preserve paragraph boundaries
    if (this.options.preserveParagraphs) {
      const paragraphEnd = this.findParagraphBoundary(text, startPos, maxEndPos);
      if (paragraphEnd > startPos + this.options.minChunkSize) {
        endPos = paragraphEnd;
      }
    }

    // Try to preserve sentence boundaries if paragraph preservation didn't work
    if (this.options.preserveSentences && endPos === maxEndPos) {
      const sentenceEnd = this.findSentenceBoundary(text, startPos, maxEndPos);
      if (sentenceEnd > startPos + this.options.minChunkSize) {
        endPos = sentenceEnd;
      }
    }

    const chunkText = text.substring(startPos, endPos).trim();
    
    return {
      text: chunkText,
      startChar: startPos,
      endChar: endPos,
      wordCount: this.countWords(chunkText),
      startPage: pageBreaks ? this.findPageNumber(startPos, pageBreaks) : undefined,
      endPage: pageBreaks ? this.findPageNumber(endPos, pageBreaks) : undefined,
      metadata: this.analyzeChunkContent(chunkText)
    };
  }

  /**
   * Find the best paragraph boundary before maxPos
   */
  private findParagraphBoundary(text: string, startPos: number, maxPos: number): number {
    // Look for double newlines (paragraph breaks)
    const searchText = text.substring(startPos, maxPos);
    const paragraphBreaks = [];
    
    let match;
    const paragraphRegex = /\n\s*\n/g;
    
    while ((match = paragraphRegex.exec(searchText)) !== null) {
      paragraphBreaks.push(startPos + match.index + match[0].length);
    }

    // Return the last paragraph break, or maxPos if none found
    return paragraphBreaks.length > 0 ? paragraphBreaks[paragraphBreaks.length - 1]! : maxPos;
  }

  /**
   * Find the best sentence boundary before maxPos
   */
  private findSentenceBoundary(text: string, startPos: number, maxPos: number): number {
    const searchText = text.substring(startPos, maxPos);
    const sentenceEnders = /[.!?]\s+/g;
    let lastSentenceEnd = maxPos;
    
    let match;
    while ((match = sentenceEnders.exec(searchText)) !== null) {
      const sentenceEndPos = startPos + match.index + match[0].length;
      if (sentenceEndPos < maxPos) {
        lastSentenceEnd = sentenceEndPos;
      }
    }

    return lastSentenceEnd;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Find which page a character position is on
   */
  private findPageNumber(charPos: number, pageBreaks: number[]): number {
    for (let i = 0; i < pageBreaks.length; i++) {
      if (charPos <= pageBreaks[i]!) {
        return i + 1;
      }
    }
    return pageBreaks.length + 1;
  }

  /**
   * Analyze chunk content to understand its structure
   */
  private analyzeChunkContent(text: string): DocumentChunk['metadata'] {
    const hasHeaders = /^#{1,6}\s+.+$/m.test(text) || /^.+\n[-=]{3,}$/m.test(text);
    const hasBulletPoints = /^[\s]*[-*•]\s+/m.test(text) || /^[\s]*\d+\.\s+/m.test(text);
    const hasQuotes = /"[^"]{10,}"/g.test(text) || /'[^']{10,}'/g.test(text);
    
    let contentType: 'narrative' | 'list' | 'table' | 'mixed' = 'narrative';
    
    if (hasBulletPoints && hasHeaders) {
      contentType = 'mixed';
    } else if (hasBulletPoints) {
      contentType = 'list';
    } else if (text.includes('|') && text.includes('\n')) {
      contentType = 'table';
    }

    return {
      hasHeaders,
      hasBulletPoints,
      hasQuotes,
      contentType
    };
  }

  /**
   * Create semantic chunks based on content structure
   */
  createSemanticChunks(text: string, pageBreaks?: number[]): DocumentChunk[] {
    // Split by major sections first
    const sections = this.splitBySections(text);
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;
    let currentPosition = 0;

    for (const section of sections) {
      const sectionChunks = this.chunkDocument(section.text, pageBreaks);
      
      // Adjust positions relative to full document
      for (const chunk of sectionChunks) {
        chunks.push({
          ...chunk,
          index: chunkIndex++,
          startChar: chunk.startChar + currentPosition,
          endChar: chunk.endChar + currentPosition,
          metadata: {
            ...chunk.metadata,
            ...(section.title && { sectionTitle: section.title })
          } as any
        });
      }
      
      currentPosition += section.text.length;
    }

    return chunks;
  }

  /**
   * Split document into sections based on headers
   */
  private splitBySections(text: string): Array<{ title?: string; text: string }> {
    const headerRegex = /^(#{1,6}\s+.+$|^.+\n[-=]{3,}$)/gm;
    const sections = [];
    let lastIndex = 0;
    let match;

    while ((match = headerRegex.exec(text)) !== null) {
      // Add previous section
      if (lastIndex < match.index) {
        sections.push({
          text: text.substring(lastIndex, match.index).trim()
        });
      }

      lastIndex = match.index;
    }

    // Add final section
    if (lastIndex < text.length) {
      sections.push({
        text: text.substring(lastIndex).trim()
      });
    }

    return sections.filter(section => section.text.length > 0);
  }

  /**
   * Create overlapping windows for better context preservation
   */
  createSlidingWindowChunks(text: string, windowSize: number = 1000, stride: number = 500): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;
    let position = 0;

    while (position < text.length) {
      const endPos = Math.min(position + windowSize, text.length);
      const chunkText = text.substring(position, endPos).trim();

      if (chunkText.length >= this.options.minChunkSize) {
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
}