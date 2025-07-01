/**
 * Adaptive document chunking with intelligent boundary detection
 * Fixed version with proper TypeScript null handling
 */

export interface AdaptiveChunkingOptions {
  minChunkSize: number;
  maxChunkSize: number;
  targetChunkSize: number;
  overlapPercentage?: number;
  overlapTokens?: number;
  preserveSentences?: boolean;
  preserveParagraphs?: boolean;
  preserveSections?: boolean;
  detectHeaders?: boolean;
  detectLists?: boolean;
  detectQuotes?: boolean;
  detectCodeBlocks?: boolean;
  strategy?: 'semantic' | 'structural' | 'hybrid' | 'sliding';
  fallbackStrategies?: {
    aiAnalysis?: boolean;
    sentimentBoundaries?: boolean;
    topicModeling?: boolean;
  };
}

export interface ChunkMetadata {
  hasHeader?: boolean;
  headerText?: string;
  headerLevel?: number;
  contentType?: 'text' | 'list' | 'quote' | 'code' | 'mixed';
  startParagraph?: number;
  endParagraph?: number;
  sentenceCount?: number;
  avgSentenceLength?: number;
  keyTerms?: string[];
  semanticDensity?: number;
  contextualImportance?: number;
  startChar: number;
  endChar: number;
  wordCount: number;
  chunkNumber: number;
  totalChunks: number;
}

export interface AdaptiveChunk {
  text: string;
  metadata: ChunkMetadata;
  embeddings?: number[];
  relatedChunks?: number[];
}

interface DocumentStructure {
  headers: Array<{ text: string; position: number; level: number }>;
  paragraphs: Array<{ start: number; end: number }>;
  sentences: Array<{ text: string; position: number }>;
  lists: Array<{ start: number; end: number; type: 'ordered' | 'unordered' }>;
  quotes: Array<{ text: string; position: number; fullMatch: string }>;
  codeBlocks: Array<{ start: number; end: number; language?: string }>;
}

export class AdaptiveChunker {
  private options: Required<AdaptiveChunkingOptions>;
  
  constructor(options: AdaptiveChunkingOptions) {
    this.options = {
      minChunkSize: options.minChunkSize || 100,
      maxChunkSize: options.maxChunkSize || 500,
      targetChunkSize: options.targetChunkSize || 300,
      overlapPercentage: options.overlapPercentage ?? 10,
      overlapTokens: options.overlapTokens ?? 50,
      preserveSentences: options.preserveSentences ?? true,
      preserveParagraphs: options.preserveParagraphs ?? true,
      preserveSections: options.preserveSections ?? false,
      detectHeaders: options.detectHeaders ?? true,
      detectLists: options.detectLists ?? true,
      detectQuotes: options.detectQuotes ?? true,
      detectCodeBlocks: options.detectCodeBlocks ?? false,
      strategy: options.strategy || 'hybrid',
      fallbackStrategies: options.fallbackStrategies || {}
    };
  }
  
  async chunkDocument(text: string): Promise<AdaptiveChunk[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }
    
    // Preprocess text
    const processedText = this.preprocessText(text);
    
    // Analyze document structure
    const structure = this.analyzeDocumentStructure(processedText);
    
    // Choose chunking strategy
    let chunks: AdaptiveChunk[] = [];
    
    switch (this.options.strategy) {
      case 'semantic':
        chunks = await this.semanticChunking(processedText, structure);
        break;
      case 'structural':
        chunks = this.structuralChunking(processedText, structure);
        break;
      case 'sliding':
        chunks = this.slidingWindowChunking(processedText, structure);
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
    chunks = this.findRelatedChunks(chunks);
    
    // Merge small chunks if needed
    return this.mergeSmallChunks(chunks);
  }
  
  private preprocessText(text: string): string {
    // Normalize whitespace
    let processed = text.replace(/\r\n/g, '\n');
    processed = processed.replace(/\r/g, '\n');
    
    // Normalize quotes
    processed = processed.replace(/[""]/g, '"');
    processed = processed.replace(/['']/g, "'");
    
    // Remove excessive whitespace while preserving structure
    processed = processed.replace(/\n{3,}/g, '\n\n');
    processed = processed.replace(/[ \t]+/g, ' ');
    
    return processed.trim();
  }
  
  private analyzeDocumentStructure(text: string): DocumentStructure {
    const structure: DocumentStructure = {
      headers: [],
      paragraphs: [],
      sentences: [],
      lists: [],
      quotes: [],
      codeBlocks: []
    };
    
    // Detect headers
    if (this.options.detectHeaders) {
      const headerPatterns = [
        /^#{1,6}\s+(.+)$/gm,  // Markdown headers
        /^([A-Z][A-Z0-9\s]+)$/gm,  // All caps headers
        /^(\d+\.?\s+[A-Z].+)$/gm,  // Numbered headers
        /^([A-Z][^.!?]+):$/gm  // Colon-terminated headers
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
      if (para.trim()) {
        structure.paragraphs.push({
          start: position,
          end: position + para.length
        });
      }
      position += para.length + 2; // +2 for \n\n
    });
    
    // Detect sentences
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    let sentenceMatch;
    while ((sentenceMatch = sentenceRegex.exec(text)) !== null) {
      structure.sentences.push({
        text: sentenceMatch[0].trim(),
        position: sentenceMatch.index
      });
    }
    
    // Detect lists
    if (this.options.detectLists) {
      const listPatterns = [
        /^(\d+\.|\*|-|\+)\s+.+$/gm,  // Ordered and unordered lists
        /^[a-z]\)\s+.+$/gm  // Letter lists
      ];
      
      listPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          // Find list boundaries
          const start = match.index;
          let end = start + match[0].length;
          
          // Look for continuation
          const nextLineStart = text.indexOf('\n', end) + 1;
          if (nextLineStart > 0 && nextLineStart < text.length) {
            const nextLine = text.substring(nextLineStart);
            if (pattern.test(nextLine)) {
              // Continue finding list items
              let currentPos = nextLineStart;
              while (currentPos < text.length) {
                const lineEnd = text.indexOf('\n', currentPos);
                const line = text.substring(currentPos, lineEnd > 0 ? lineEnd : undefined);
                if (!pattern.test(line)) break;
                end = lineEnd > 0 ? lineEnd : text.length;
                currentPos = lineEnd > 0 ? lineEnd + 1 : text.length;
              }
            }
          }
          
          structure.lists.push({
            start,
            end,
            type: /^\d+\./.test(match[0]) ? 'ordered' : 'unordered'
          });
        }
      });
    }
    
    // Detect quotes
    if (this.options.detectQuotes) {
      const quotePatterns = [
        /"([^"]+)"/g,
        /'([^']+)'/g,
        /^>\s+(.+)$/gm  // Markdown blockquotes
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
  
  private async semanticChunking(text: string, structure: DocumentStructure): Promise<AdaptiveChunk[]> {
    const chunks: AdaptiveChunk[] = [];
    const sentences = structure.sentences;
    
    if (sentences.length === 0) {
      return this.fallbackChunking(text);
    }
    
    let currentChunk: string[] = [];
    let currentSize = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!sentence) continue;
      
      const sentenceSize = sentence.text?.split(/\s+/).length || 0;
      
      // Check if adding this sentence would exceed max size
      if (currentSize + sentenceSize > this.options.maxChunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(this.createChunk(
          currentChunk.join(' '),
          chunks.length,
          sentence.position || 0
        ));
        
        // Start new chunk with overlap
        const overlapSentences = this.calculateOverlapSentences(currentChunk);
        currentChunk = overlapSentences;
        currentSize = overlapSentences.join(' ').split(/\s+/).length;
      }
      
      if (sentence.text) {
        currentChunk.push(sentence.text);
      }
      currentSize += sentenceSize;
      
      // Check for semantic boundaries
      if (sentence.text && this.isSemanticBoundary(sentence.text, sentences[i + 1]?.text)) {
        if (currentSize >= this.options.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.join(' '),
            chunks.length,
            sentence.position || 0
          ));
          currentChunk = [];
          currentSize = 0;
        }
      }
    }
    
    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        currentChunk.join(' '),
        chunks.length,
        0
      ));
    }
    
    return chunks;
  }
  
  private structuralChunking(text: string, structure: DocumentStructure): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    
    // If we have headers, chunk by sections
    if (structure.headers.length > 0) {
      for (let i = 0; i < structure.headers.length; i++) {
        const header = structure.headers[i];
        if (!header) continue;
        
        const nextHeader = structure.headers[i + 1];
        
        const sectionStart = header.position || 0;
        const sectionEnd = nextHeader?.position || text.length;
        const sectionText = text.substring(sectionStart, sectionEnd).trim();
        
        // If section is too large, split it
        if (sectionText.split(/\s+/).length > this.options.maxChunkSize) {
          const subChunks = this.splitLargeSection(sectionText, header.text || '');
          chunks.push(...subChunks.map((chunk, idx) => ({
            ...chunk,
            metadata: {
              ...chunk.metadata,
              hasHeader: idx === 0,
              headerText: idx === 0 ? header.text : undefined,
              headerLevel: idx === 0 ? header.level : undefined
            }
          })));
        } else {
          chunks.push(this.createChunk(
            sectionText,
            chunks.length,
            sectionStart,
            header.text || ''
          ));
        }
      }
    } else {
      // Fall back to paragraph-based chunking
      return this.paragraphBasedChunking(text, structure);
    }
    
    return chunks;
  }
  
  private slidingWindowChunking(text: string, _structure: DocumentStructure): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    const words = text.split(/\s+/);
    const stepSize = Math.floor(this.options.targetChunkSize * (1 - this.options.overlapPercentage / 100));
    
    for (let i = 0; i < words.length; i += stepSize) {
      const chunkWords = words.slice(i, i + this.options.targetChunkSize);
      if (chunkWords.length >= this.options.minChunkSize) {
        chunks.push(this.createChunk(
          chunkWords.join(' '),
          chunks.length
        ));
      }
    }
    
    return chunks;
  }
  
  private async hybridChunking(text: string, structure: DocumentStructure): Promise<AdaptiveChunk[]> {
    // Combine structural and semantic approaches
    let chunks: AdaptiveChunk[] = [];
    
    // Start with structural boundaries
    if (structure.headers.length > 0) {
      chunks = this.structuralChunking(text, structure);
    } else {
      chunks = await this.semanticChunking(text, structure);
    }
    
    // Refine with semantic analysis if enabled
    if (this.options.fallbackStrategies?.aiAnalysis) {
      chunks = await this.refineWithAIAnalysis(chunks);
    }
    
    return chunks;
  }
  
  private applyOverlap(chunks: AdaptiveChunk[]): AdaptiveChunk[] {
    if (this.options.overlapTokens === 0 && this.options.overlapPercentage === 0) {
      return chunks;
    }
    
    const overlappedChunks: AdaptiveChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      if (!currentChunk) continue;
      
      const previousChunk = chunks[i - 1];
      const nextChunk = chunks[i + 1];
      
      let chunkText = currentChunk.text || '';
      
      // Add overlap from previous chunk
      if (previousChunk && this.options.overlapTokens > 0) {
        const previousWords = previousChunk.text.split(/\s+/);
        const overlapWords = previousWords.slice(-this.options.overlapTokens);
        chunkText = overlapWords.join(' ') + ' ' + chunkText;
      }
      
      // Add overlap to next chunk
      if (nextChunk && this.options.overlapTokens > 0) {
        const nextWords = nextChunk.text.split(/\s+/);
        const overlapWords = nextWords.slice(0, this.options.overlapTokens);
        chunkText = chunkText + ' ' + overlapWords.join(' ');
      }
      
      overlappedChunks.push({
        ...currentChunk,
        text: chunkText
      });
    }
    
    return overlappedChunks;
  }
  
  private enrichChunksWithMetadata(chunks: AdaptiveChunk[], _structure: DocumentStructure): AdaptiveChunk[] {
    const totalChunks = chunks.length;
    
    return chunks.map((chunk, index) => {
      const metadata: ChunkMetadata = {
        ...chunk.metadata,
        totalChunks // Update totalChunks here
      };
      
      // Count sentences
      const sentences = this.extractSentences(chunk.text);
      metadata.sentenceCount = sentences.length;
      metadata.avgSentenceLength = sentences.length > 0 
        ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length 
        : 0;
      
      // Detect content type
      metadata.contentType = this.detectContentType(chunk.text);
      
      // Extract key terms
      metadata.keyTerms = this.extractKeyTerms(chunk.text);
      
      // Calculate semantic density
      metadata.semanticDensity = this.calculateSemanticDensity(chunk.text);
      
      // Estimate contextual importance
      metadata.contextualImportance = this.estimateContextualImportance(chunk, index, chunks);
      
      return {
        ...chunk,
        metadata
      };
    });
  }
  
  private findRelatedChunks(chunks: AdaptiveChunk[]): AdaptiveChunk[] {
    // Extract keywords from each chunk
    const chunkKeywords = chunks.map(chunk => 
      new Set(this.extractKeyTerms(chunk.text))
    );
    
    return chunks.map((chunk, index) => {
      const related: number[] = [];
      const myKeywords = chunkKeywords[index];
      
      if (!myKeywords) {
        return chunk;
      }
      
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
  
  private mergeSmallChunks(chunks: AdaptiveChunk[]): AdaptiveChunk[] {
    const merged: AdaptiveChunk[] = [];
    let i = 0;
    
    while (i < chunks.length) {
      const currentChunk = chunks[i];
      if (!currentChunk) {
        i++;
        continue;
      }
      
      const currentSize = currentChunk.text.split(/\s+/).length;
      
      if (currentSize < this.options.minChunkSize && i < chunks.length - 1) {
        // Try to merge with next chunk
        const nextChunk = chunks[i + 1];
        if (nextChunk) {
          const nextSize = nextChunk.text.split(/\s+/).length;
          
          if (currentSize + nextSize <= this.options.maxChunkSize) {
            // Merge chunks
            merged.push({
              text: currentChunk.text + ' ' + nextChunk.text,
              metadata: {
                ...currentChunk.metadata,
                contentType: 'mixed'
              }
            });
            i += 2;
            continue;
          }
        }
      }
      
      merged.push(currentChunk);
      i++;
    }
    
    return merged;
  }
  
  private detectHeaderLevel(headerText: string): number {
    if (headerText.match(/^#{1}\s/)) return 1;
    if (headerText.match(/^#{2}\s/)) return 2;
    if (headerText.match(/^#{3}\s/)) return 3;
    if (headerText.match(/^#{4}\s/)) return 4;
    if (headerText.match(/^#{5}\s/)) return 5;
    if (headerText.match(/^#{6}\s/)) return 6;
    if (headerText.match(/^\d+\./)) return 2;
    if (headerText.match(/^[A-Z][A-Z\s]+$/)) return 1;
    return 2;
  }
  
  private isSemanticBoundary(_currentSentence: string, nextSentence?: string): boolean {
    if (!nextSentence) return true;
    
    // Check for topic shifts
    const transitionWords = [
      'however', 'furthermore', 'moreover', 'nevertheless',
      'in conclusion', 'in summary', 'therefore', 'thus',
      'on the other hand', 'in contrast', 'alternatively'
    ];
    
    const nextLower = nextSentence.toLowerCase();
    return transitionWords.some(word => nextLower.startsWith(word));
  }
  
  private calculateOverlapSentences(sentences: string[]): string[] {
    const overlapWords = Math.floor(this.options.targetChunkSize * this.options.overlapPercentage / 100);
    
    const result: string[] = [];
    let wordCount = 0;
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      if (!sentence) continue;
      
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
    // Split large sections into smaller chunks
    const chunks: AdaptiveChunk[] = [];
    const sentences = this.extractSentences(text);
    
    let currentChunk: string[] = [];
    let currentSize = 0;
    
    for (const sentence of sentences) {
      const sentenceSize = sentence.split(/\s+/).length;
      
      if (currentSize + sentenceSize > this.options.maxChunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          currentChunk.join(' '),
          chunks.length,
          0,
          chunks.length === 0 ? headerText : undefined
        ));
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(sentence);
      currentSize += sentenceSize;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        currentChunk.join(' '),
        chunks.length,
        0,
        chunks.length === 0 ? headerText : undefined
      ));
    }
    
    return chunks;
  }
  
  private paragraphBasedChunking(text: string, structure: DocumentStructure): AdaptiveChunk[] {
    const chunks: AdaptiveChunk[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;
    
    for (const para of structure.paragraphs) {
      const paraText = text.substring(para.start, para.end).trim();
      const paraSize = paraText.split(/\s+/).length;
      
      if (currentSize + paraSize > this.options.maxChunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          currentChunk.join('\n\n'),
          chunks.length
        ));
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(paraText);
      currentSize += paraSize;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        currentChunk.join('\n\n'),
        chunks.length
      ));
    }
    
    return chunks;
  }
  
  private fallbackChunking(text: string): AdaptiveChunk[] {
    // Simple word-based chunking as fallback
    const words = text.split(/\s+/);
    const chunks: AdaptiveChunk[] = [];
    
    for (let i = 0; i < words.length; i += this.options.targetChunkSize) {
      const chunkWords = words.slice(i, i + this.options.targetChunkSize);
      chunks.push(this.createChunk(
        chunkWords.join(' '),
        chunks.length
      ));
    }
    
    return chunks;
  }
  
  private async refineWithAIAnalysis(chunks: AdaptiveChunk[]): Promise<AdaptiveChunk[]> {
    // Placeholder for AI-based refinement
    // In production, this would call an AI service to analyze chunk boundaries
    return chunks;
  }
  
  private createChunk(text: string, index: number, position?: number, headerText?: string): AdaptiveChunk {
    const trimmedText = text.trim();
    const metadata: ChunkMetadata = {
      startChar: position || 0,
      endChar: (position || 0) + trimmedText.length,
      wordCount: trimmedText.split(/\s+/).filter(w => w.length > 0).length,
      chunkNumber: index,
      totalChunks: 0 // This will be updated later
    };
    
    if (headerText) {
      metadata.hasHeader = true;
      metadata.headerText = headerText;
    }
    
    return {
      text: trimmedText,
      metadata
    };
  }
  
  private extractSentences(text: string): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }
  
  private detectContentType(text: string): ChunkMetadata['contentType'] {
    const listPattern = /^(\d+\.|\*|-|\+)\s+/m;
    const codePattern = /```[\s\S]*```|`[^`]+`/;
    const quotePattern = /^>\s+/m;
    
    if (codePattern.test(text)) return 'code';
    if (quotePattern.test(text)) return 'quote';
    if (listPattern.test(text)) return 'list';
    
    return 'text';
  }
  
  private extractKeyTerms(text: string): string[] {
    // Simple keyword extraction - in production, use TF-IDF or similar
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'been', 'was', 'were', 'being'
    ]);
    
    const termFreq = new Map<string, number>();
    
    for (const word of words) {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        termFreq.set(cleaned, (termFreq.get(cleaned) || 0) + 1);
      }
    }
    
    // Return top 10 terms
    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }
  
  private calculateSemanticDensity(text: string): number {
    const sentences = this.extractSentences(text);
    const words = text.split(/\s+/).length;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    
    // Simple density calculation
    const lexicalDiversity = uniqueWords / words;
    const avgSentenceLength = sentences.length > 0 ? words / sentences.length : 0;
    
    // Normalize to 0-1 scale
    return Math.min(1, (lexicalDiversity * 0.5) + (Math.min(avgSentenceLength, 20) / 40));
  }
  
  private estimateContextualImportance(chunk: AdaptiveChunk, index: number, allChunks: AdaptiveChunk[]): number {
    let importance = 0.5; // Base importance
    
    // Headers indicate importance
    if (chunk.metadata?.hasHeader) {
      importance += 0.2;
    }
    
    // First and last chunks are often important
    if (index === 0 || index === allChunks.length - 1) {
      importance += 0.1;
    }
    
    // Chunks with many keywords are important
    const keyTermCount = chunk.metadata?.keyTerms?.length || 0;
    if (keyTermCount > 5) {
      importance += 0.1;
    }
    
    // High semantic density indicates importance
    const density = chunk.metadata?.semanticDensity || 0;
    if (density > 0.7) {
      importance += 0.1;
    }
    
    return Math.min(1, importance);
  }
  
  private calculateKeywordOverlap(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}