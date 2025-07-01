/**
 * Document chunking utilities for breaking large documents into manageable pieces
 * Supports various chunking strategies for different processing needs
 */

import { AdaptiveChunker, type AdaptiveChunk } from './adaptive-chunker';

export interface ChunkOptions {
  maxChunkSize?: number;      // Maximum characters per chunk
  overlapSize?: number;       // Characters to overlap between chunks
  preserveSentences?: boolean; // Try to preserve sentence boundaries
  preserveParagraphs?: boolean; // Try to preserve paragraph boundaries
  minChunkSize?: number;      // Minimum characters per chunk
}

export interface DocumentChunk {
  index?: number;
  text: string;
  startChar: number;
  endChar: number;
  startPage?: number;
  endPage?: number;
  wordCount?: number;
  chunkNumber?: number;
  totalChunks?: number;
  metadata?: {
    hasHeaders?: boolean;
    hasBulletPoints?: boolean;
    hasQuotes?: boolean;
    contentType?: 'narrative' | 'list' | 'table' | 'mixed';
    headerText?: string;
    semanticDensity?: number;
    contextualImportance?: number;
  };
}

export class DocumentChunker {
  private options: Required<ChunkOptions>;
  private adaptiveChunker: AdaptiveChunker;

  constructor(options: ChunkOptions = {}) {
    this.options = {
      maxChunkSize: 1500,      // ~300-400 words
      overlapSize: 150,        // ~30-40 words overlap
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 50,        // ~10-15 words minimum
      ...options
    };
    
    // Initialize adaptive chunker with matching options
    this.adaptiveChunker = new AdaptiveChunker({
      minChunkSize: this.options.minChunkSize,
      maxChunkSize: this.options.maxChunkSize,
      targetChunkSize: Math.floor((this.options.minChunkSize + this.options.maxChunkSize) / 2),
      overlapTokens: Math.floor(this.options.overlapSize / 5), // Rough conversion
      preserveSentences: this.options.preserveSentences,
      preserveParagraphs: this.options.preserveParagraphs
    });
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

  /**
   * Use adaptive chunking for intelligent document segmentation
   */
  async chunkDocumentAdaptive(text: string, documentType?: 'academic' | 'conversational' | 'technical' | 'general'): Promise<DocumentChunk[]> {
    // Select appropriate chunking strategy based on document type
    let chunker: AdaptiveChunker;
    
    switch (documentType) {
      case 'academic':
        chunker = new AdaptiveChunker({
          minChunkSize: 200,
          maxChunkSize: 800,
          targetChunkSize: 500,
          preserveSections: true,
          detectHeaders: true,
          strategy: 'structural'
        });
        break;
      case 'conversational':
        chunker = new AdaptiveChunker({
          minChunkSize: 100,
          maxChunkSize: 400,
          targetChunkSize: 250,
          preserveSentences: true,
          detectQuotes: true,
          strategy: 'semantic'
        });
        break;
      case 'technical':
        chunker = new AdaptiveChunker({
          minChunkSize: 150,
          maxChunkSize: 600,
          targetChunkSize: 400,
          detectCodeBlocks: true,
          detectLists: true,
          strategy: 'hybrid'
        });
        break;
      default:
        chunker = this.adaptiveChunker;
    }
    
    // Get adaptive chunks
    const adaptiveChunks = await chunker.chunkDocument(text);
    
    // Convert to DocumentChunk format
    return adaptiveChunks.map((chunk, index) => ({
      index,
      text: chunk.text,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      wordCount: chunk.metadata.wordCount,
      chunkNumber: chunk.metadata.chunkNumber,
      totalChunks: chunk.metadata.totalChunks,
      metadata: {
        hasHeaders: chunk.metadata.hasHeader,
        headerText: chunk.metadata.headerText,
        contentType: chunk.metadata.contentType === 'text' ? 'narrative' : 
                    chunk.metadata.contentType === 'list' ? 'list' : 'mixed',
        semanticDensity: chunk.metadata.semanticDensity,
        contextualImportance: chunk.metadata.contextualImportance
      }
    }));
  }

  /**
   * Create chunks optimized for embedding generation
   */
  async createEmbeddingOptimizedChunks(text: string): Promise<DocumentChunk[]> {
    // Use smaller chunks with more overlap for better embedding quality
    const embeddingChunker = new AdaptiveChunker({
      minChunkSize: 50,
      maxChunkSize: 500,
      targetChunkSize: 250,
      overlapPercentage: 20,
      preserveSentences: true,
      strategy: 'sliding'
    });
    
    const chunks = await embeddingChunker.chunkDocument(text);
    
    return chunks.map((chunk, index) => ({
      index,
      text: chunk.text,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      wordCount: chunk.metadata.wordCount,
      chunkNumber: chunk.metadata.chunkNumber,
      totalChunks: chunk.metadata.totalChunks,
      metadata: {
        contextualImportance: chunk.metadata.contextualImportance,
        semanticDensity: chunk.metadata.semanticDensity
      }
    }));
  }

  /**
   * Create hierarchical chunks for multi-level analysis
   */
  async createHierarchicalChunks(text: string): Promise<{
    coarse: DocumentChunk[];
    fine: DocumentChunk[];
    sentences: DocumentChunk[];
  }> {
    // Coarse chunks for high-level understanding
    const coarseChunker = new AdaptiveChunker({
      minChunkSize: 500,
      maxChunkSize: 2000,
      targetChunkSize: 1000,
      preserveSections: true,
      strategy: 'structural'
    });
    
    // Fine chunks for detailed analysis
    const fineChunker = new AdaptiveChunker({
      minChunkSize: 100,
      maxChunkSize: 500,
      targetChunkSize: 300,
      overlapPercentage: 15,
      strategy: 'hybrid'
    });
    
    // Sentence-level chunks for precise extraction
    const sentenceChunker = new AdaptiveChunker({
      minChunkSize: 10,
      maxChunkSize: 100,
      targetChunkSize: 50,
      preserveSentences: true,
      strategy: 'semantic'
    });
    
    const [coarseChunks, fineChunks, sentenceChunks] = await Promise.all([
      coarseChunker.chunkDocument(text),
      fineChunker.chunkDocument(text),
      sentenceChunker.chunkDocument(text)
    ]);
    
    return {
      coarse: this.convertAdaptiveChunks(coarseChunks),
      fine: this.convertAdaptiveChunks(fineChunks),
      sentences: this.convertAdaptiveChunks(sentenceChunks)
    };
  }

  /**
   * Analyze document and recommend best chunking strategy
   */
  async analyzeAndChunk(text: string): Promise<{
    recommendedStrategy: string;
    chunks: DocumentChunk[];
    analysis: {
      documentType: string;
      averageSentenceLength: number;
      hasStructure: boolean;
      contentDensity: number;
    };
  }> {
    // Analyze document characteristics
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(1, sentences.length);
    const hasHeaders = /^#{1,6}\s+.+$/m.test(text) || /^[A-Z][A-Z\s]+$/m.test(text);
    const hasLists = /^[\s]*[-*•]\s+/m.test(text) || /^[\s]*\d+\.\s+/m.test(text);
    const hasQuotes = /"[^"]{20,}"/g.test(text);
    
    // Determine document type
    let documentType: 'academic' | 'conversational' | 'technical' | 'general' = 'general';
    let recommendedStrategy = 'hybrid';
    
    if (hasHeaders && avgSentenceLength > 15) {
      documentType = 'academic';
      recommendedStrategy = 'structural';
    } else if (hasQuotes && avgSentenceLength < 15) {
      documentType = 'conversational';
      recommendedStrategy = 'semantic';
    } else if (hasLists || text.includes('function') || text.includes('class')) {
      documentType = 'technical';
      recommendedStrategy = 'hybrid';
    }
    
    // Calculate content density
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/));
    const totalWords = text.split(/\s+/).length;
    const contentDensity = uniqueWords.size / Math.max(1, totalWords);
    
    // Perform chunking
    const chunks = await this.chunkDocumentAdaptive(text, documentType);
    
    return {
      recommendedStrategy,
      chunks,
      analysis: {
        documentType,
        averageSentenceLength: avgSentenceLength,
        hasStructure: hasHeaders || hasLists,
        contentDensity
      }
    };
  }

  /**
   * Convert adaptive chunks to DocumentChunk format
   */
  private convertAdaptiveChunks(adaptiveChunks: AdaptiveChunk[]): DocumentChunk[] {
    return adaptiveChunks.map((chunk, index) => ({
      index,
      text: chunk.text,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      wordCount: chunk.metadata.wordCount,
      chunkNumber: chunk.metadata.chunkNumber,
      totalChunks: chunk.metadata.totalChunks,
      metadata: {
        hasHeaders: chunk.metadata.hasHeader,
        headerText: chunk.metadata.headerText,
        contentType: chunk.metadata.contentType === 'text' ? 'narrative' : 
                    chunk.metadata.contentType === 'list' ? 'list' : 'mixed',
        semanticDensity: chunk.metadata.semanticDensity,
        contextualImportance: chunk.metadata.contextualImportance
      }
    }));
  }
}