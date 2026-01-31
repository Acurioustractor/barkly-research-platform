import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/database-safe';
import { OptimizedChunkingService } from '@/lib/ai/processing/optimized-chunking-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnthropicResult {
  themes: Array<{
    name: string;
    description: string;
    confidence: number;
    cultural_significance?: string;
  }>;
  quotes: Array<{
    text: string;
    speaker?: string;
    cultural_sensitivity: 'public' | 'restricted' | 'sacred' | 'confidential';
    requires_attribution: boolean;
  }>;
  insights: Array<{
    insight: string;
    type: 'service_gap' | 'community_need' | 'success_story' | 'barrier' | 'opportunity';
    confidence: number;
    evidence: string[];
  }>;
}

export class AnthropicProcessor {
  
  /**
   * Process document content using Anthropic Claude
   */
  static async processWithClaude(content: string, title: string): Promise<AnthropicResult> {
    const systemPrompt = `You are an expert in community intelligence and Indigenous Australian community development, specifically for the Barkly region and Tennant Creek. 

CRITICAL CULTURAL PROTOCOLS:
- Respect Indigenous knowledge sovereignty and CARE+ principles (Collective benefit, Authority to control, Responsibility, Ethics)
- Follow Traditional Owner protocols for cultural content
- Mark cultural sensitivity appropriately: public, restricted, sacred, confidential
- Do not assume speaker identity without clear attribution
- Prioritize community voice and self-determination
- Recognize Aboriginal authority over cultural knowledge

ANALYSIS FOCUS:
- Community development initiatives and outcomes
- Youth programs, education, and cultural identity
- Service gaps and community needs
- Government partnerships and funding initiatives
- Economic development and employment
- Health, housing, and social services
- Cultural preservation and traditional knowledge
- Infrastructure and facilities

Extract community intelligence as structured JSON with these exact fields:
{
  "themes": [
    {
      "name": "specific theme name",
      "description": "detailed description of theme",
      "confidence": 0.85,
      "cultural_significance": "public|restricted|sacred|confidential"
    }
  ],
  "quotes": [
    {
      "text": "exact quote text",
      "speaker": "speaker name if clearly identified or null",
      "cultural_sensitivity": "public|restricted|sacred|confidential", 
      "requires_attribution": true|false
    }
  ],
  "insights": [
    {
      "insight": "specific finding about service gaps or community needs",
      "type": "service_gap|community_need|success_story|barrier|opportunity",
      "confidence": 0.8,
      "evidence": ["supporting text excerpts"]
    }
  ]
}

IMPORTANT: Return only valid JSON. No additional text or formatting.`;

    const userPrompt = `Analyze this document from the Barkly Regional Deal community intelligence system:

DOCUMENT: "${title}"

CONTENT:
${content}

Extract themes, community quotes, and insights following cultural protocols. Focus on community voice, service delivery, and development outcomes.`;

    try {
      console.log(`Calling Claude API for document analysis (${content.length} chars)`);
      
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      });

      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
      
      if (!responseText) {
        throw new Error('Empty response from Claude');
      }

      console.log('Claude API response received');

      // Parse JSON response
      const parsed = JSON.parse(responseText);
      
      // Validate structure and clean data
      return {
        themes: (parsed.themes || []).map((theme: any) => ({
          name: theme.name || 'Unnamed Theme',
          description: theme.description || '',
          confidence: Math.min(Math.max(theme.confidence || 0.5, 0), 1),
          cultural_significance: theme.cultural_significance || 'public'
        })),
        quotes: (parsed.quotes || []).map((quote: any) => ({
          text: quote.text || '',
          speaker: quote.speaker || null,
          cultural_sensitivity: quote.cultural_sensitivity || 'public',
          requires_attribution: quote.requires_attribution || false
        })).filter((quote: any) => quote.text.length > 20),
        insights: (parsed.insights || []).map((insight: any) => ({
          insight: insight.insight || '',
          type: insight.type || 'community_need',
          confidence: Math.min(Math.max(insight.confidence || 0.5, 0), 1),
          evidence: insight.evidence || []
        })).filter((insight: any) => insight.insight.length > 10)
      };

    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Process a document with chunking for large content
   */
  static async processDocument(documentId: string): Promise<AnthropicResult> {
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

    if (!content || content.length < 50) {
      throw new Error(`Document ${documentId} has insufficient content for processing`);
    }

    console.log(`Processing document "${title}" with Claude (${content.length} chars)`);

    // For large documents, process in chunks
    if (content.length > 8000) {
      return await this.processLargeDocument(content, title);
    } else {
      return await this.processWithClaude(content, title);
    }
  }

  /**
   * Process large documents using optimized chunking
   */
  private static async processLargeDocument(content: string, title: string): Promise<AnthropicResult> {
    console.log(`Processing large document with optimized chunking: ${content.length} chars`);
    
    // Use optimized chunking service
    const chunkingService = new OptimizedChunkingService();
    
    // Determine document type
    let documentType: 'academic' | 'conversational' | 'technical' | 'general' = 'general';
    if (title.toLowerCase().includes('deal') || title.toLowerCase().includes('agreement')) {
      documentType = 'academic';
    } else if (title.toLowerCase().includes('interview') || title.toLowerCase().includes('transcript')) {
      documentType = 'conversational';
    }
    
    const chunkingResult = await chunkingService.chunkDocument(content, {
      processingType: 'deep',
      documentType: documentType,
      enableCaching: true,
      maxChunkSize: 1500
    });

    console.log(`Created ${chunkingResult.chunks.length} optimized chunks using ${chunkingResult.metadata.strategy} strategy`);

    const allResults: AnthropicResult[] = [];

    // Process each chunk
    for (let i = 0; i < chunkingResult.chunks.length; i++) {
      const chunk = chunkingResult.chunks[i];
      
      try {
        console.log(`Processing chunk ${i + 1}/${chunkingResult.chunks.length} (${chunk.wordCount} words)`);
        
        const chunkResult = await this.processWithClaude(chunk.text, `${title} (Part ${i + 1})`);
        allResults.push(chunkResult);

        // Rate limiting - wait between requests
        if (i < chunkingResult.chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }

    // Merge results
    return this.mergeResults(allResults);
  }

  /**
   * Merge results from multiple chunks
   */
  private static mergeResults(results: AnthropicResult[]): AnthropicResult {
    const merged: AnthropicResult = {
      themes: [],
      quotes: [],
      insights: []
    };

    for (const result of results) {
      merged.themes.push(...result.themes);
      merged.quotes.push(...result.quotes);
      merged.insights.push(...result.insights);
    }

    // Deduplicate and sort
    merged.themes = this.deduplicateThemes(merged.themes);
    merged.quotes = this.deduplicateQuotes(merged.quotes);
    merged.insights = this.deduplicateInsights(merged.insights);

    return merged;
  }

  /**
   * Remove duplicate themes
   */
  private static deduplicateThemes(themes: any[]): any[] {
    const unique: any[] = [];
    
    for (const theme of themes) {
      const isDuplicate = unique.some(existing => 
        existing.name.toLowerCase() === theme.name.toLowerCase() ||
        this.calculateSimilarity(theme.name, existing.name) > 0.8
      );
      
      if (!isDuplicate) {
        unique.push(theme);
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  /**
   * Remove duplicate quotes
   */
  private static deduplicateQuotes(quotes: any[]): any[] {
    const unique: any[] = [];
    
    for (const quote of quotes) {
      const isDuplicate = unique.some(existing => 
        existing.text.includes(quote.text) || 
        quote.text.includes(existing.text) ||
        this.calculateSimilarity(quote.text, existing.text) > 0.7
      );
      
      if (!isDuplicate && quote.text.length > 30) {
        unique.push(quote);
      }
    }

    return unique.slice(0, 10);
  }

  /**
   * Remove duplicate insights
   */
  private static deduplicateInsights(insights: any[]): any[] {
    const unique: any[] = [];
    
    for (const insight of insights) {
      const isDuplicate = unique.some(existing => 
        this.calculateSimilarity(insight.insight, existing.insight) > 0.7
      );
      
      if (!isDuplicate) {
        unique.push(insight);
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  /**
   * Calculate string similarity
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Save results to database
   */
  static async saveResults(documentId: string, results: AnthropicResult): Promise<void> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      console.log(`Saving Claude processing results for document ${documentId}`);

      // Save themes
      for (const theme of results.themes) {
        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            cultural_significance, ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${theme.name},
            ${theme.description},
            ${theme.confidence},
            ${theme.cultural_significance || 'public'},
            'claude-3-haiku',
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
            ${quote.speaker},
            ${quote.cultural_sensitivity},
            ${quote.requires_attribution},
            NOW()
          )
        `;
      }

      // Save insights
      for (const insight of results.insights) {
        const evidenceJson = JSON.stringify(insight.evidence);
        await prisma.$queryRaw`
          INSERT INTO document_insights (
            id, document_id, insight, type, confidence, evidence, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${insight.insight},
            ${insight.type},
            ${insight.confidence},
            ${evidenceJson}::jsonb,
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
        ai_model: 'claude-3-haiku'
      });

      await prisma.$queryRaw`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          processed_at = NOW(),
          ai_analysis = ${analysisJson}::jsonb
        WHERE id = ${documentId}::uuid
      `;

      console.log(`Successfully saved Claude processing results for document ${documentId}`);

    } catch (error) {
      console.error(`Error saving Claude processing results for document ${documentId}:`, error);
      throw error;
    }
  }
}