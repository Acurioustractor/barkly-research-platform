import { prisma } from '@/lib/database-safe';

export interface SimpleTheme {
  name: string;
  description: string;
  confidence: number;
}

export interface SimpleQuote {
  text: string;
  speaker?: string;
  cultural_sensitivity: 'public' | 'restricted' | 'sacred' | 'confidential';
}

export interface SimpleInsight {
  insight: string;
  type: 'service_gap' | 'community_need' | 'success_story' | 'barrier' | 'opportunity';
  confidence: number;
}

/**
 * Simple rule-based document processor for when AI APIs are unavailable
 */
export class SimpleProcessor {
  
  /**
   * Extract themes using keyword analysis
   */
  static extractThemes(content: string, title: string): SimpleTheme[] {
    const themes: SimpleTheme[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Theme detection patterns
    const themePatterns = [
      {
        keywords: ['youth', 'young people', 'children', 'students', 'teenager'],
        name: 'Youth Development',
        description: 'Programs and services focused on young people in the community'
      },
      {
        keywords: ['cultural', 'traditional', 'aboriginal', 'indigenous', 'cultural identity'],
        name: 'Cultural Identity',
        description: 'Cultural preservation and traditional knowledge systems'
      },
      {
        keywords: ['employment', 'jobs', 'training', 'workforce', 'business', 'economic'],
        name: 'Economic Development',
        description: 'Employment opportunities and economic growth initiatives'
      },
      {
        keywords: ['education', 'school', 'learning', 'training', 'boarding'],
        name: 'Education Services',
        description: 'Educational programs and learning opportunities'
      },
      {
        keywords: ['health', 'medical', 'wellbeing', 'trauma', 'mental health'],
        name: 'Health and Wellbeing',
        description: 'Health services and community wellbeing programs'
      },
      {
        keywords: ['community', 'social', 'family', 'support', 'services'],
        name: 'Community Support',
        description: 'Social services and community support programs'
      },
      {
        keywords: ['infrastructure', 'facility', 'centre', 'hub', 'accommodation'],
        name: 'Infrastructure Development',
        description: 'Community facilities and infrastructure projects'
      },
      {
        keywords: ['governance', 'government', 'leadership', 'partnership', 'collaboration'],
        name: 'Governance and Leadership',
        description: 'Government partnerships and community leadership'
      }
    ];

    for (const pattern of themePatterns) {
      let matchCount = 0;
      let totalMentions = 0;

      for (const keyword of pattern.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (lowerContent.match(regex) || []).length;
        const titleMatches = (lowerTitle.match(regex) || []).length;
        
        if (matches > 0 || titleMatches > 0) {
          matchCount++;
          totalMentions += matches + (titleMatches * 2); // Weight title matches higher
        }
      }

      if (matchCount >= 2 || totalMentions >= 3) {
        const confidence = Math.min(0.9, 0.4 + (matchCount * 0.1) + (totalMentions * 0.05));
        themes.push({
          name: pattern.name,
          description: pattern.description,
          confidence: Math.round(confidence * 100) / 100
        });
      }
    }

    return themes.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Extract quotes using simple pattern matching
   */
  static extractQuotes(content: string): SimpleQuote[] {
    const quotes: SimpleQuote[] = [];
    
    // Look for quoted text patterns
    const quotePatterns = [
      /"([^"]{50,300})"/g,  // Text in double quotes
      /'([^']{50,300})'/g,  // Text in single quotes
      /said[:\s]+"([^"]{30,200})"/gi,  // "said: quote"
      /stated[:\s]+"([^"]{30,200})"/gi, // "stated: quote"
    ];

    for (const pattern of quotePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && quotes.length < 10) {
        const quoteText = match[1].trim();
        
        // Skip if too short or looks like metadata
        if (quoteText.length < 30 || 
            quoteText.includes('http') || 
            quoteText.includes('www') ||
            quoteText.includes('@') ||
            /^\d+$/.test(quoteText)) {
          continue;
        }

        // Determine cultural sensitivity
        let sensitivity: 'public' | 'restricted' | 'sacred' | 'confidential' = 'public';
        if (quoteText.toLowerCase().includes('sacred') || 
            quoteText.toLowerCase().includes('ceremony') ||
            quoteText.toLowerCase().includes('ritual')) {
          sensitivity = 'sacred';
        } else if (quoteText.toLowerCase().includes('traditional knowledge') ||
                   quoteText.toLowerCase().includes('cultural protocol')) {
          sensitivity = 'restricted';
        }

        quotes.push({
          text: quoteText,
          cultural_sensitivity: sensitivity
        });
      }
    }

    // Look for community voice indicators
    const communityVoicePatterns = [
      /community members?\s+(?:said|believe|feel|think|express)[^.]{20,150}\./gi,
      /elders?\s+(?:said|believe|feel|think|express)[^.]{20,150}\./gi,
      /young people\s+(?:said|believe|feel|think|express)[^.]{20,150}\./gi,
    ];

    for (const pattern of communityVoicePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && quotes.length < 15) {
        quotes.push({
          text: match[0].trim(),
          cultural_sensitivity: 'public'
        });
      }
    }

    return quotes.slice(0, 10);
  }

  /**
   * Extract insights using gap and opportunity detection
   */
  static extractInsights(content: string): SimpleInsight[] {
    const insights: SimpleInsight[] = [];
    const lowerContent = content.toLowerCase();

    // Service gap patterns
    const gapPatterns = [
      {
        pattern: /(?:lack|need|gap|missing|insufficient|limited|shortage).*?(?:service|program|facility|support|resource)/gi,
        type: 'service_gap' as const,
        confidence: 0.8
      },
      {
        pattern: /(?:barrier|challenge|obstacle|difficulty|problem).*?(?:access|delivery|implementation)/gi,
        type: 'barrier' as const,
        confidence: 0.7
      },
      {
        pattern: /(?:opportunity|potential|could|should|recommend).*?(?:develop|establish|create|improve|enhance)/gi,
        type: 'opportunity' as const,
        confidence: 0.6
      },
      {
        pattern: /(?:success|effective|working|achievement|positive).*?(?:outcome|result|impact|change)/gi,
        type: 'success_story' as const,
        confidence: 0.8
      }
    ];

    for (const gapPattern of gapPatterns) {
      let match;
      while ((match = gapPattern.pattern.exec(content)) !== null && insights.length < 15) {
        const insightText = match[0].trim();
        
        if (insightText.length > 20 && insightText.length < 200) {
          insights.push({
            insight: insightText,
            type: gapPattern.type,
            confidence: gapPattern.confidence
          });
        }
      }
    }

    // Community need patterns
    const needPatterns = [
      'accommodation for students',
      'youth support services',
      'crisis support',
      'cultural programs',
      'employment opportunities',
      'health services',
      'transport services',
      'childcare services'
    ];

    for (const need of needPatterns) {
      if (lowerContent.includes(need)) {
        insights.push({
          insight: `Community need identified: ${need}`,
          type: 'community_need',
          confidence: 0.7
        });
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  /**
   * Process a document using simple rule-based analysis
   */
  static async processDocumentSimple(documentId: string): Promise<{
    themes: SimpleTheme[];
    quotes: SimpleQuote[];
    insights: SimpleInsight[];
  }> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    // Get document content
    const document = await prisma.$queryRaw<Array<any>>`
      SELECT id, title, content, cultural_sensitivity, file_type
      FROM documents 
      WHERE id = ${documentId}::uuid
    `;

    if (!document || document.length === 0) {
      throw new Error(`Document ${documentId} not found`);
    }

    const doc = document[0];
    const content = doc.content || '';
    const title = doc.title || '';

    if (!content || content.length < 100) {
      throw new Error(`Document ${documentId} has insufficient content for processing`);
    }

    console.log(`Processing document "${title}" (${content.length} chars) using simple analysis`);

    // Extract themes, quotes, and insights
    const themes = this.extractThemes(content, title);
    const quotes = this.extractQuotes(content);
    const insights = this.extractInsights(content);

    console.log(`Found ${themes.length} themes, ${quotes.length} quotes, ${insights.length} insights`);

    return {
      themes,
      quotes,
      insights
    };
  }

  /**
   * Save simple processing results to database
   */
  static async saveSimpleResults(
    documentId: string,
    results: { themes: SimpleTheme[]; quotes: SimpleQuote[]; insights: SimpleInsight[] }
  ): Promise<void> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      // Save themes
      for (const theme of results.themes) {
        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${theme.name},
            ${theme.description},
            ${theme.confidence},
            'rule-based-simple',
            NOW()
          )
        `;
      }

      // Save quotes
      for (const quote of results.quotes) {
        await prisma.$queryRaw`
          INSERT INTO document_quotes (
            id, document_id, quote_text, knowledge_holder, cultural_sensitivity,
            requires_attribution, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${quote.text},
            ${quote.speaker || null},
            ${quote.cultural_sensitivity},
            ${quote.speaker ? true : false},
            NOW()
          )
        `;
      }

      // Save insights
      for (const insight of results.insights) {
        await prisma.$queryRaw`
          INSERT INTO document_insights (
            id, document_id, insight, type, confidence, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${insight.insight},
            ${insight.type},
            ${insight.confidence},
            NOW()
          )
        `;
      }

      // Update document processing status
      const analysisJson = JSON.stringify({
        themes_found: results.themes.length,
        quotes_found: results.quotes.length,
        insights_found: results.insights.length,
        processed_at: new Date().toISOString(),
        processing_method: 'rule-based-simple'
      });

      await prisma.$queryRaw`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          processed_at = NOW(),
          ai_analysis = ${analysisJson}::jsonb
        WHERE id = ${documentId}::uuid
      `;

      console.log(`Successfully saved simple processing results for document ${documentId}`);

    } catch (error) {
      console.error(`Error saving simple processing results for document ${documentId}:`, error);
      throw error;
    }
  }
}