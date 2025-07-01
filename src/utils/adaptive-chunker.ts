/**
 * Adaptive document chunking with intelligent boundary detection
 * Provides context-aware text segmentation for optimal AI processing
 */

export interface AdaptiveChunkingOptions {
  // Size constraints
  minChunkSize?: number;
  maxChunkSize?: number;
  targetChunkSize?: number;
  
  // Overlap settings
  overlapTokens?: number;
  overlapPercentage?: number;
  
  // Boundary detection
  preserveSentences?: boolean;
  preserveParagraphs?: boolean;
  preserveSections?: boolean;
  
  // Content-aware settings
  detectHeaders?: boolean;
  detectLists?: boolean;
  detectCodeBlocks?: boolean;
  detectQuotes?: boolean;
  
  // Strategy
  strategy?: 'semantic' | 'structural' | 'hybrid' | 'sliding';
}

export interface ChunkMetadata {
  chunkNumber: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  wordCount: number;
  sentenceCount: number;
  hasHeader: boolean;
  headerText?: string;
  contentType: 'text' | 'list' | 'code' | 'quote' | 'mixed';
  semanticDensity: number; // 0-1, higher means more information-dense
  contextualImportance: number; // 0-1, based on keywords and structure
}

export interface AdaptiveChunk {
  text: string;
  metadata: ChunkMetadata;
  embeddings?: number[];
  relatedChunks?: number[]; // Indices of semantically related chunks
}

export class AdaptiveChunker {
  private readonly defaultOptions: Required<AdaptiveChunkingOptions> = {
    minChunkSize: 100,
    maxChunkSize: 1500,
    targetChunkSize: 750,
    overlapTokens: 50,
    overlapPercentage: 10,
    preserveSentences: true,
    preserveParagraphs: true,
    preserveSections: true,
    detectHeaders: true,
    detectLists: true,
    detectCodeBlocks: true,
    detectQuotes: true,
    strategy: 'hybrid'
  };

  private options: Required<AdaptiveChunkingOptions>;

  constructor(options: AdaptiveChunkingOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Main chunking method that adapts to document structure
   */
  async chunkDocument(text: string): Promise<AdaptiveChunk[]> {
    // Pre-process text
    const processedText = this.preprocessText(text);
    
    // Detect document structure
    const structure = this.analyzeDocumentStructure(processedText);
    
    // Choose chunking strategy based on content
    let chunks: AdaptiveChunk[];
    
    switch (this.options.strategy) {
      case 'semantic':
        chunks = await this.semanticChunking(processedText, structure);
        break;
      case 'structural':
        chunks = this.structuralChunking(processedText, structure);
        break;
      case 'sliding':
        chunks = this.slidingWindowChunking(processedText);
        break;
      case 'hybrid':
      default:
        chunks = await this.hybridChunking(processedText, structure);
    }

    // Apply overlap
    chunks = this.applyOverlap(chunks);
    
    // Calculate metadata
    chunks = this.enrichChunksWithMetadata(chunks, structure);
    
    // Find related chunks
    chunks = await this.identifyRelatedChunks(chunks);
    
    return chunks;
  }

  /**
   * Preprocess text for better chunking
   */
  private preprocessText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '  ')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\w)(\d)/g, '$1 $2') // Add space between letters and numbers
      // Preserve paragraph breaks
      .replace(/\n\n+/g, '\n\n')
      // Remove excessive spaces
      .replace(/ +/g, ' ')
      .trim();
  }

  /**
   * Analyze document structure for intelligent chunking
   */
  private analyzeDocumentStructure(text: string): DocumentStructure {
    const structure: DocumentStructure = {
      sections: [],
      headers: [],
      paragraphs: [],
      lists: [],
      quotes: [],
      codeBlocks: [],
      sentences: []
    };

    // Detect headers (common patterns)
    if (this.options.detectHeaders) {
      const headerPatterns = [
        /^#+\s+(.+)$/gm, // Markdown headers
        /^([A-Z][A-Z\s]+)$/gm, // ALL CAPS headers
        /^(\d+\.?\s+[A-Z].+)$/gm, // Numbered headers
        /^([A-Z][^.!?]+:)$/gm // Headers ending with colon
      ];

      headerPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          structure.headers.push({
            text: match[1] || '',
            position: match.index,
            level: this.detectHeaderLevel(match[0])
          });
        }
      });

      // Sort headers by position
      structure.headers.sort((a, b) => a.position - b.position);
    }

    // Detect paragraphs
    const paragraphs = text.split(/\n\n+/);
    let position = 0;
    paragraphs.forEach(para => {
      if (para.trim().length > 0) {
        structure.paragraphs.push({
          text: para,
          position,
          endPosition: position + para.length
        });
      }
      position += para.length + 2; // Account for \n\n
    });

    // Detect sentences
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    let sentenceMatch;
    while ((sentenceMatch = sentenceRegex.exec(text)) !== null) {
      structure.sentences.push({
        text: sentenceMatch[0].trim(),
        position: sentenceMatch.index,
        endPosition: sentenceMatch.index + sentenceMatch[0].length
      });
    }

    // Detect lists
    if (this.options.detectLists) {
      const listPatterns = [
        /^[\s]*[-*•]\s+(.+)$/gm, // Bullet points
        /^[\s]*\d+\.?\s+(.+)$/gm, // Numbered lists
        /^[\s]*[a-z]\)\s+(.+)$/gm // Lettered lists
      ];

      listPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          structure.lists.push({
            text: match[0],
            position: match.index,
            type: pattern.source.includes('\\d') ? 'numbered' : 'bullet'
          });
        }
      });
    }

    // Detect quotes
    if (this.options.detectQuotes) {
      const quotePatterns = [
        /"([^"]+)"/g,
        /'([^']+)'/g,
        /[""]([^""]+)[""]g/
      ];

      quotePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if ((match[1] || '').length > 20) { // Only significant quotes
            structure.quotes.push({
              text: match[1] || '',
              position: match.index,
              fullMatch: match[0]
            });
          }
        }
      });
    }

    return structure;
  }

  /**
   * Semantic chunking based on meaning and context
   */
  private async semanticChunking(
    text: string, 
    structure: DocumentStructure
  ): Promise<AdaptiveChunk[]> {
    const chunks: AdaptiveChunk[] = [];
    const sentences = structure.sentences;
    
    let currentChunk: string[] = [];
    let currentSize = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceSize = sentence?.text?.split(/\s+/).length || 0;
      
      // Check if adding this sentence would exceed max size
      if (currentSize + sentenceSize > this.options.maxChunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(this.createChunk(
          currentChunk.join(' '),
          chunks.length,
          sentence?.position || 0
        ));
        
        // Start new chunk with overlap
        const overlapSentences = this.calculateOverlapSentences(currentChunk);
        currentChunk = overlapSentences;
        currentSize = overlapSentences.join(' ').split(/\s+/).length;
      }
      
      if (sentence?.text) {
        currentChunk.push(sentence.text);
      }
      currentSize += sentenceSize;
      
      // Check for semantic boundaries
      if (sentence?.text && this.isSemanticBoundary(sentence.text, sentences[i + 1]?.text)) {
        if (currentSize >= this.options.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.join(' '),
            chunks.length,
            sentence?.position || 0
          ));
          currentChunk = [];
          currentSize = 0;
        }
      }
    }
    
    // Add remaining content
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        currentChunk.join(' '),
        chunks.length,
        text.length
      ));
    }
    
    return chunks;
  }

  /**
   * Structural chunking based on document hierarchy
   */
  private structuralChunking(
    text: string,
    structure: DocumentStructure
  ): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    
    // If we have headers, chunk by sections
    if (structure.headers.length > 0) {
      for (let i = 0; i < structure.headers.length; i++) {
        const header = structure.headers[i];
        const nextHeader = structure.headers[i + 1];
        
        const sectionStart = header?.position || 0;
        const sectionEnd = nextHeader?.position || text.length;
        const sectionText = text.substring(sectionStart, sectionEnd).trim();
        
        // If section is too large, split it
        if (sectionText.split(/\s+/).length > this.options.maxChunkSize) {
          const subChunks = this.splitLargeSection(sectionText, header?.text || '');
          chunks.push(...subChunks.map((chunk, idx) => ({
            ...chunk,
            metadata: {
              ...chunk.metadata,
              chunkNumber: chunks.length + idx
            }
          })));
        } else if (sectionText.split(/\s+/).length >= this.options.minChunkSize) {
          chunks.push(this.createChunk(
            sectionText,
            chunks.length,
            sectionStart,
            header?.text || ''
          ));
        }
      }
    } else {
      // Fall back to paragraph-based chunking
      let currentChunk = '';
      let chunkStart = 0;
      
      for (const paragraph of structure.paragraphs) {
        const newChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph.text;
        const wordCount = newChunk.split(/\s+/).length;
        
        if (wordCount > this.options.maxChunkSize && currentChunk) {
          chunks.push(this.createChunk(currentChunk, chunks.length, chunkStart));
          currentChunk = paragraph.text;
          chunkStart = paragraph.position;
        } else if (wordCount >= this.options.targetChunkSize) {
          chunks.push(this.createChunk(newChunk, chunks.length, chunkStart));
          currentChunk = '';
          chunkStart = paragraph.endPosition + 2;
        } else {
          currentChunk = newChunk;
        }
      }
      
      if (currentChunk) {
        chunks.push(this.createChunk(currentChunk, chunks.length, chunkStart));
      }
    }
    
    return chunks;
  }

  /**
   * Sliding window chunking for maximum coverage
   */
  private slidingWindowChunking(text: string): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    const words = text.split(/\s+/);
    const windowSize = this.options.targetChunkSize;
    const stepSize = Math.floor(windowSize * (1 - this.options.overlapPercentage / 100));
    
    for (let i = 0; i < words.length; i += stepSize) {
      const chunkWords = words.slice(i, i + windowSize);
      if (chunkWords.length >= this.options.minChunkSize) {
        const chunkText = chunkWords.join(' ');
        chunks.push(this.createChunk(chunkText, chunks.length, i));
      }
    }
    
    return chunks;
  }

  /**
   * Hybrid chunking combining semantic and structural approaches
   */
  private async hybridChunking(
    text: string,
    structure: DocumentStructure
  ): Promise<AdaptiveChunk[]> {
    const chunks: AdaptiveChunk[] = [];
    
    // First, try structural chunking by headers
    if (structure.headers.length > 2) {
      const structuralChunks = this.structuralChunking(text, structure);
      
      // Refine each structural chunk semantically
      for (const chunk of structuralChunks) {
        if (chunk.metadata.wordCount > this.options.maxChunkSize) {
          // Split large chunks semantically
          const subStructure = this.analyzeDocumentStructure(chunk.text);
          const semanticSubChunks = await this.semanticChunking(chunk.text, subStructure);
          chunks.push(...semanticSubChunks);
        } else {
          chunks.push(chunk);
        }
      }
    } else {
      // Fall back to pure semantic chunking
      chunks.push(...await this.semanticChunking(text, structure));
    }
    
    // Merge very small chunks
    return this.mergeSmallChunks(chunks);
  }

  /**
   * Apply overlap between chunks for context preservation
   */
  private applyOverlap(chunks: AdaptiveChunk[]): AdaptiveChunk[] {
    if (this.options.overlapTokens === 0 && this.options.overlapPercentage === 0) {
      return chunks;
    }
    
    const overlappedChunks: AdaptiveChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      const previousChunk = chunks[i - 1];
      const nextChunk = chunks[i + 1];
      
      let chunkText = currentChunk?.text || '';
      
      // Add overlap from previous chunk
      if (previousChunk && this.options.overlapTokens > 0) {
        const previousWords = previousChunk.text.split(/\s+/);
        const overlapWords = previousWords.slice(-this.options.overlapTokens);
        chunkText = overlapWords.join(' ') + ' ' + chunkText;
      }
      
      // Add overlap to next chunk (preview)
      if (nextChunk && this.options.overlapTokens > 0) {
        const nextWords = nextChunk.text.split(/\s+/);
        const overlapWords = nextWords.slice(0, this.options.overlapTokens);
        chunkText = chunkText + ' ' + overlapWords.join(' ');
      }
      
      if (currentChunk) {
        overlappedChunks.push({
          ...currentChunk,
          text: chunkText
        });
      }
    }
    
    return overlappedChunks;
  }

  /**
   * Enrich chunks with detailed metadata
   */
  private enrichChunksWithMetadata(
    chunks: AdaptiveChunk[],
    structure: DocumentStructure
  ): AdaptiveChunk[] {
    return chunks.map((chunk, index) => {
      const words = chunk.text.split(/\s+/).filter(w => w.length > 0);
      const sentences = chunk.text.match(/[^.!?]+[.!?]+/g) || [];
      
      // Check if chunk starts with or contains a header
      const header = structure.headers.find(h => 
        chunk.text.includes(h.text) && 
        chunk.text.indexOf(h.text) < 100
      );
      
      // Determine content type
      const contentType = this.detectContentType(chunk.text, structure);
      
      // Calculate semantic density (ratio of unique words to total words)
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const semanticDensity = uniqueWords.size / Math.max(1, words.length);
      
      // Calculate contextual importance
      const importance = this.calculateImportance(chunk.text, structure);
      
      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          chunkNumber: index + 1,
          totalChunks: chunks.length,
          wordCount: words.length,
          sentenceCount: sentences.length,
          hasHeader: !!header,
          headerText: header?.text,
          contentType,
          semanticDensity,
          contextualImportance: importance
        }
      };
    });
  }

  /**
   * Identify semantically related chunks
   */
  private async identifyRelatedChunks(chunks: AdaptiveChunk[]): Promise<AdaptiveChunk[]> {
    // Simple keyword-based relatedness (can be enhanced with embeddings)
    const chunkKeywords = chunks.map(chunk => this.extractKeywords(chunk.text));
    
    return chunks.map((chunk, index) => {
      const related: number[] = [];
      const myKeywords = chunkKeywords[index];
      
      for (let i = 0; i < chunks.length; i++) {
        if (i !== index) {
          const otherKeywords = chunkKeywords[i];
          const overlap = myKeywords && otherKeywords ? this.calculateKeywordOverlap(myKeywords, otherKeywords) : 0;
          
          if (overlap > 0.3) { // 30% keyword overlap threshold
            related.push(i);
          }
        }
      }
      
      return {
        ...chunk,
        relatedChunks: related
      };
    });
  }

  /**
   * Helper methods
   */
  
  private createChunk(
    text: string,
    chunkNumber: number,
    startPosition: number,
    headerText?: string
  ): AdaptiveChunk {
    return {
      text: text.trim(),
      metadata: {
        chunkNumber,
        totalChunks: 0, // Will be updated later
        startChar: startPosition,
        endChar: startPosition + text.length,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        sentenceCount: (text.match(/[^.!?]+[.!?]+/g) || []).length,
        hasHeader: !!headerText,
        headerText,
        contentType: 'text',
        semanticDensity: 0,
        contextualImportance: 0
      }
    };
  }

  private detectHeaderLevel(headerText: string): number {
    if (headerText.match(/^#{1}\s/)) return 1;
    if (headerText.match(/^#{2}\s/)) return 2;
    if (headerText.match(/^#{3}\s/)) return 3;
    if (headerText.match(/^\d+\.\s/)) return 1;
    if (headerText.match(/^\d+\.\d+\s/)) return 2;
    if (headerText.match(/^[A-Z][A-Z\s]+$/)) return 1;
    return 2;
  }

  private isSemanticBoundary(currentSentence: string, nextSentence?: string): boolean {
    if (!nextSentence) return true;
    
    // Check for topic shifts
    const transitionWords = [
      'however', 'therefore', 'moreover', 'furthermore', 'consequently',
      'in conclusion', 'in summary', 'on the other hand', 'meanwhile'
    ];
    
    const nextLower = nextSentence.toLowerCase();
    return transitionWords.some(word => nextLower.startsWith(word));
  }

  private calculateOverlapSentences(sentences: string[]): string[] {
    const totalWords = sentences.join(' ').split(/\s+/).length;
    const overlapWords = Math.floor(totalWords * (this.options.overlapPercentage / 100));
    
    const result: string[] = [];
    let wordCount = 0;
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      const sentenceWords = sentence.split(/\s+/).length;
      
      if (wordCount + sentenceWords <= overlapWords || result.length === 0) {
        result.unshift(sentence);
        wordCount += sentenceWords;
      } else {
        break;
      }
    }
    
    return result;
  }

  private splitLargeSection(text: string, headerText?: string): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = headerText ? headerText + '\n\n' : '';
    let wordCount = currentChunk.split(/\s+/).length;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).length;
      
      if (wordCount + sentenceWords > this.options.targetChunkSize && currentChunk) {
        chunks.push(this.createChunk(currentChunk, chunks.length, 0));
        currentChunk = '';
        wordCount = 0;
      }
      
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      wordCount += sentenceWords;
    }
    
    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, chunks.length, 0));
    }
    
    return chunks;
  }

  private mergeSmallChunks(chunks: AdaptiveChunk[]): AdaptiveChunk[] {
    const merged: AdaptiveChunk[] = [];
    let i = 0;
    
    while (i < chunks.length) {
      const current = chunks[i];
      
      if (current.metadata.wordCount < this.options.minChunkSize && i < chunks.length - 1) {
        // Try to merge with next chunk
        const next = chunks[i + 1];
        const combinedWords = current.metadata.wordCount + next.metadata.wordCount;
        
        if (combinedWords <= this.options.maxChunkSize) {
          merged.push({
            text: current.text + '\n\n' + next.text,
            metadata: {
              ...current.metadata,
              endChar: next.metadata.endChar,
              wordCount: combinedWords,
              sentenceCount: current.metadata.sentenceCount + next.metadata.sentenceCount
            }
          });
          i += 2;
          continue;
        }
      }
      
      merged.push(current);
      i++;
    }
    
    return merged;
  }

  private detectContentType(
    text: string,
    structure: DocumentStructure
  ): 'text' | 'list' | 'code' | 'quote' | 'mixed' {
    const listCount = structure.lists.filter(l => text.includes(l.text)).length;
    const quoteCount = structure.quotes.filter(q => text.includes(q.text)).length;
    
    const totalLines = text.split('\n').length;
    
    if (listCount > totalLines * 0.5) return 'list';
    if (quoteCount > 2) return 'quote';
    if (text.includes('```') || text.match(/^\s{4,}/gm)) return 'code';
    if (listCount > 0 || quoteCount > 0) return 'mixed';
    
    return 'text';
  }

  private calculateImportance(text: string, structure: DocumentStructure): number {
    let importance = 0.5; // Base importance
    
    // Headers increase importance
    if (structure.headers.some(h => text.includes(h.text))) {
      importance += 0.2;
    }
    
    // Key terms increase importance
    const keyTerms = [
      'conclusion', 'summary', 'important', 'key', 'critical',
      'essential', 'significant', 'major', 'primary', 'finding'
    ];
    
    const lowerText = text.toLowerCase();
    const keyTermCount = keyTerms.filter(term => lowerText.includes(term)).length;
    importance += Math.min(0.3, keyTermCount * 0.1);
    
    // Questions increase importance
    if (text.includes('?')) {
      importance += 0.1;
    }
    
    return Math.min(1, importance);
  }

  private extractKeywords(text: string): Set<string> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only words longer than 4 chars
    
    const stopWords = new Set([
      'about', 'after', 'again', 'against', 'along', 'although',
      'another', 'around', 'because', 'before', 'behind', 'between',
      'during', 'every', 'first', 'found', 'from', 'further',
      'however', 'inside', 'instead', 'large', 'later', 'least',
      'less', 'many', 'more', 'most', 'much', 'never', 'next',
      'often', 'other', 'over', 'perhaps', 'quite', 'rather',
      'really', 'second', 'several', 'should', 'since', 'small',
      'some', 'still', 'such', 'than', 'that', 'their', 'them',
      'then', 'there', 'these', 'they', 'this', 'those', 'though',
      'through', 'under', 'until', 'upon', 'very', 'what', 'when',
      'where', 'which', 'while', 'will', 'with', 'within', 'would'
    ]);
    
    return new Set(words.filter(word => !stopWords.has(word)));
  }

  private calculateKeywordOverlap(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / Math.max(1, union.size);
  }
}

// Document structure interfaces
interface DocumentStructure {
  sections: Section[];
  headers: Header[];
  paragraphs: Paragraph[];
  lists: ListItem[];
  quotes: Quote[];
  codeBlocks: CodeBlock[];
  sentences: Sentence[];
}

interface Section {
  title: string;
  level: number;
  startPosition: number;
  endPosition: number;
}

interface Header {
  text: string;
  position: number;
  level: number;
}

interface Paragraph {
  text: string;
  position: number;
  endPosition: number;
}

interface ListItem {
  text: string;
  position: number;
  type: 'bullet' | 'numbered';
}

interface Quote {
  text: string;
  position: number;
  fullMatch: string;
}

interface CodeBlock {
  code: string;
  language?: string;
  position: number;
}

interface Sentence {
  text: string;
  position: number;
  endPosition: number;
}

/**
 * Factory function for common chunking strategies
 */
export class ChunkingStrategies {
  static forAcademicPapers(): AdaptiveChunker {
    return new AdaptiveChunker({
      minChunkSize: 200,
      maxChunkSize: 1000,
      targetChunkSize: 600,
      preserveSections: true,
      detectHeaders: true,
      strategy: 'structural'
    });
  }

  static forConversationalData(): AdaptiveChunker {
    return new AdaptiveChunker({
      minChunkSize: 50,
      maxChunkSize: 500,
      targetChunkSize: 250,
      preserveSentences: true,
      detectQuotes: true,
      strategy: 'semantic'
    });
  }

  static forTechnicalDocuments(): AdaptiveChunker {
    return new AdaptiveChunker({
      minChunkSize: 150,
      maxChunkSize: 800,
      targetChunkSize: 500,
      detectCodeBlocks: true,
      preserveSections: true,
      strategy: 'hybrid'
    });
  }

  static forMaximumCoverage(): AdaptiveChunker {
    return new AdaptiveChunker({
      minChunkSize: 100,
      maxChunkSize: 600,
      targetChunkSize: 400,
      overlapPercentage: 25,
      strategy: 'sliding'
    });
  }
}