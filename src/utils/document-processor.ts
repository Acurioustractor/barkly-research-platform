/**
 * Document processing utilities for extracting content from PDFs
 * Handles text extraction, keyword identification, and initial analysis
 */

export interface DocumentMetadata {
  filename: string;
  size: number;
  uploadDate: Date;
  pageCount?: number;
  wordCount?: number;
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  keywords: string[];
  themes: string[];
  quotes: ExtractedQuote[];
  insights: string[];
}

export interface ExtractedQuote {
  text: string;
  page?: number;
  context?: string;
  speaker?: string;
  confidence: number;
}

export class DocumentProcessor {
  /**
   * Extract text content from PDF buffer
   */
  static async extractTextFromPDF(buffer: Buffer, filename: string): Promise<ExtractedContent> {
    try {
      // Import pdf-parse dynamically to avoid SSR issues
      const pdfParse = (await import('pdf-parse')).default;
      
      const data = await pdfParse(buffer);
      
      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        uploadDate: new Date(),
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length
      };

      // Extract content using various analysis methods
      const keywords = this.extractKeywords(data.text);
      const themes = this.identifyThemes(data.text);
      const quotes = this.extractQuotes(data.text);
      const insights = this.generateInsights(data.text);

      return {
        text: data.text,
        metadata,
        keywords,
        themes,
        quotes,
        insights
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract key terms and concepts from text
   */
  private static extractKeywords(text: string): string[] {
    // Community research specific keywords
    const communityTerms = [
      'youth', 'young people', 'community', 'culture', 'traditional',
      'elder', 'family', 'education', 'health', 'wellbeing',
      'services', 'support', 'engagement', 'participation',
      'identity', 'connection', 'country', 'language'
    ];

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Prioritize community research terms
    const keywords = Array.from(wordCounts.entries())
      .filter(([word, count]) => {
        const isCommunityTerm = communityTerms.includes(word);
        const isFrequent = count >= 3;
        return isCommunityTerm || isFrequent;
      })
      .sort((a, b) => {
        const aIsCommunity = communityTerms.includes(a[0]);
        const bIsCommunity = communityTerms.includes(b[0]);
        
        if (aIsCommunity && !bIsCommunity) return -1;
        if (!aIsCommunity && bIsCommunity) return 1;
        
        return b[1] - a[1]; // Sort by frequency
      })
      .slice(0, 20)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * Identify main themes in the document
   */
  private static identifyThemes(text: string): string[] {
    const themePatterns = [
      { theme: 'Youth Voice and Agency', patterns: ['youth voice', 'young people say', 'listen to youth', 'youth participation'] },
      { theme: 'Cultural Identity', patterns: ['cultural identity', 'traditional knowledge', 'cultural connection', 'two-way learning'] },
      { theme: 'Education and Learning', patterns: ['education', 'school', 'learning', 'teaching', 'academic'] },
      { theme: 'Health and Wellbeing', patterns: ['health', 'wellbeing', 'mental health', 'physical health', 'emotional'] },
      { theme: 'Family and Community', patterns: ['family', 'community', 'kinship', 'relationships', 'support networks'] },
      { theme: 'Services and Support', patterns: ['services', 'support', 'programs', 'intervention', 'assistance'] },
      { theme: 'Employment and Future', patterns: ['employment', 'jobs', 'career', 'future', 'aspirations'] },
      { theme: 'Challenges and Barriers', patterns: ['challenges', 'barriers', 'problems', 'difficulties', 'obstacles'] }
    ];

    const lowerText = text.toLowerCase();
    const identifiedThemes: string[] = [];

    themePatterns.forEach(({ theme, patterns }) => {
      const matchCount = patterns.reduce((count, pattern) => {
        const regex = new RegExp(pattern, 'gi');
        const matches = lowerText.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);

      if (matchCount >= 2) { // Threshold for theme identification
        identifiedThemes.push(theme);
      }
    });

    return identifiedThemes;
  }

  /**
   * Extract quotes and key statements from text
   */
  private static extractQuotes(text: string): ExtractedQuote[] {
    const quotes: ExtractedQuote[] = [];
    
    // Patterns for identifying quotes
    const quotePatterns = [
      /"([^"]{20,200})"/g,                    // Text in double quotes
      /'([^']{20,200})'/g,                    // Text in single quotes
      /said[:\s]+"([^"]{20,200})"/gi,         // "said: quote"
      /explained[:\s]+"([^"]{20,200})"/gi,    // "explained: quote"
      /stated[:\s]+"([^"]{20,200})"/gi,       // "stated: quote"
    ];

    quotePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const quoteText = match[1]?.trim();
        
        // Skip if quote is too short or contains mostly non-alphabetic characters
        if (!quoteText || quoteText.length < 20 || !/[a-zA-Z]/.test(quoteText)) {
          continue;
        }

        // Calculate confidence based on context
        const beforeText = text.substring(Math.max(0, match.index - 100), match.index);
        const confidence = this.calculateQuoteConfidence(quoteText, beforeText);

        quotes.push({
          text: quoteText,
          context: beforeText.substring(beforeText.lastIndexOf('.') + 1).trim(),
          confidence
        });
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueQuotes = quotes
      .filter((quote, index, array) => 
        array.findIndex(q => q.text === quote.text) === index
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Keep top 10 quotes

    return uniqueQuotes;
  }

  /**
   * Calculate confidence score for extracted quotes
   */
  private static calculateQuoteConfidence(quote: string, context: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for youth-related quotes
    const youthTerms = ['young', 'youth', 'teenager', 'student'];
    if (youthTerms.some(term => context.toLowerCase().includes(term))) {
      confidence += 0.2;
    }

    // Increase confidence for direct speech indicators
    const speechIndicators = ['said', 'explained', 'stated', 'mentioned', 'told'];
    if (speechIndicators.some(indicator => context.toLowerCase().includes(indicator))) {
      confidence += 0.2;
    }

    // Increase confidence for personal statements
    const personalIndicators = ['I ', 'we ', 'my ', 'our '];
    if (personalIndicators.some(indicator => quote.includes(indicator))) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Generate initial insights from document content
   */
  private static generateInsights(text: string): string[] {
    const insights: string[] = [];
    const lowerText = text.toLowerCase();

    // Check for participation patterns
    if (lowerText.includes('participate') || lowerText.includes('involvement')) {
      insights.push('Document discusses youth participation and involvement in community activities');
    }

    // Check for service gaps
    if (lowerText.includes('gap') || lowerText.includes('lack') || lowerText.includes('need')) {
      insights.push('Document identifies service gaps or unmet needs in the community');
    }

    // Check for cultural elements
    if (lowerText.includes('culture') || lowerText.includes('traditional') || lowerText.includes('elder')) {
      insights.push('Document emphasizes cultural elements and traditional knowledge systems');
    }

    // Check for challenges
    if (lowerText.includes('challenge') || lowerText.includes('barrier') || lowerText.includes('difficult')) {
      insights.push('Document outlines challenges and barriers faced by the community');
    }

    // Check for positive outcomes
    if (lowerText.includes('success') || lowerText.includes('achievement') || lowerText.includes('progress')) {
      insights.push('Document highlights successful outcomes and positive progress');
    }

    return insights;
  }

  /**
   * Process multiple documents and create comparative analysis
   */
  static async processMultipleDocuments(documents: { buffer: Buffer; filename: string }[]): Promise<{
    individual: ExtractedContent[];
    comparative: {
      commonThemes: string[];
      uniqueKeywords: Map<string, string[]>;
      documentSimilarity: number;
    };
  }> {
    const individual = await Promise.all(
      documents.map(doc => this.extractTextFromPDF(doc.buffer, doc.filename))
    );

    // Comparative analysis
    const allThemes = individual.flatMap(doc => doc.themes);
    const themeFrequency = new Map<string, number>();
    
    allThemes.forEach(theme => {
      themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
    });

    const commonThemes = Array.from(themeFrequency.entries())
      .filter(([, count]) => count > 1)
      .map(([theme]) => theme);

    const uniqueKeywords = new Map<string, string[]>();
    individual.forEach(doc => {
      const otherKeywords = individual
        .filter(other => other !== doc)
        .flatMap(other => other.keywords);
      
      const unique = doc.keywords.filter(keyword => !otherKeywords.includes(keyword));
      uniqueKeywords.set(doc.metadata.filename, unique);
    });

    // Simple similarity calculation based on shared themes
    const documentSimilarity = commonThemes.length / Math.max(1, 
      Math.max(...individual.map(doc => doc.themes.length))
    );

    return {
      individual,
      comparative: {
        commonThemes,
        uniqueKeywords,
        documentSimilarity
      }
    };
  }
}