import { OpenAI } from 'openai';
import { prisma } from '@/lib/database-safe';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProcessingResult {
  themes: DocumentTheme[];
  quotes: DocumentQuote[];
  insights: DocumentInsight[];
  entities: DocumentEntity[];
}

export interface DocumentTheme {
  theme_name: string;
  description: string;
  confidence_score: number;
  cultural_significance?: string;
}

export interface DocumentQuote {
  quote_text: string;
  knowledge_holder?: string;
  cultural_sensitivity: 'public' | 'restricted' | 'sacred' | 'confidential';
  requires_attribution: boolean;
  start_position?: number;
  end_position?: number;
}

export interface DocumentInsight {
  insight: string;
  type: 'service_gap' | 'community_need' | 'success_story' | 'barrier' | 'opportunity';
  confidence: number;
  evidence: string[];
}

export interface DocumentEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'service' | 'program';
  category?: string;
  confidence: number;
  context: string;
}

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 4000; // Characters per chunk
  private static readonly OVERLAP = 200; // Character overlap between chunks

  /**
   * Process a document through the complete AI pipeline
   */
  static async processDocument(documentId: string): Promise<ProcessingResult> {
    try {
      console.log(`Starting AI processing for document ${documentId}`);

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

      if (!content || content.length < 100) {
        throw new Error(`Document ${documentId} has insufficient content for processing`);
      }

      // Split content into chunks for processing
      const chunks = this.splitIntoChunks(content);
      console.log(`Split document into ${chunks.length} chunks`);

      // Process each chunk
      const allThemes: DocumentTheme[] = [];
      const allQuotes: DocumentQuote[] = [];
      const allInsights: DocumentInsight[] = [];
      const allEntities: DocumentEntity[] = [];

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);

        const chunkResult = await this.processChunk(chunks[i], doc.title, i);

        allThemes.push(...chunkResult.themes);
        allQuotes.push(...chunkResult.quotes);
        allInsights.push(...chunkResult.insights);
        allEntities.push(...chunkResult.entities);

        // Add delay to respect rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Deduplicate and consolidate results
      const result = {
        themes: this.deduplicateThemes(allThemes),
        quotes: this.deduplicateQuotes(allQuotes),
        insights: this.consolidateInsights(allInsights),
        entities: this.deduplicateEntities(allEntities)
      };

      console.log(`Processing complete. Found ${result.themes.length} themes, ${result.quotes.length} quotes, ${result.insights.length} insights, ${result.entities.length} entities`);

      return result;

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Process a single chunk of content
   */
  private static async processChunk(
    content: string,
    documentTitle: string,
    chunkIndex: number
  ): Promise<ProcessingResult> {

    const systemPrompt = `You are an AI assistant specializing in community intelligence and cultural analysis for Indigenous Australian communities, particularly the Barkly region and Tennant Creek.

CRITICAL CULTURAL PROTOCOLS:
- Respect Indigenous knowledge sovereignty and CARE+ principles
- Mark any cultural content appropriately for sensitivity
- Do not assume speaker identity without clear attribution
- Prioritize community voice and self-determination
- Recognize Traditional Owner authority over cultural content

Your task is to analyze community documents and extract:
1. THEMES: Key community issues, priorities, and topics
2. QUOTES: Direct community voices and statements  
3. INSIGHTS: Service gaps, opportunities, barriers, and community needs
4. ENTITIES: Organizations, services, people, and places mentioned

Focus on:
- Community development and social services
- Youth programs and education
- Cultural preservation and protocols
- Economic development and employment
- Health and wellbeing services
- Government initiatives and partnerships
- Infrastructure and facilities

RESPONSE FORMAT: JSON only, no additional text.`;

    const userPrompt = `Analyze this section from "${documentTitle}":

${content}

Extract community intelligence in this exact JSON format:
{
  "themes": [
    {
      "theme_name": "specific theme name",
      "description": "detailed description",
      "confidence_score": 0.85,
      "cultural_significance": "public|restricted|sacred|confidential"
    }
  ],
  "quotes": [
    {
      "quote_text": "exact quote text",
      "knowledge_holder": "speaker name if clearly identified, null otherwise",
      "cultural_sensitivity": "public|restricted|sacred|confidential",
      "requires_attribution": true|false,
      "start_position": 123,
      "end_position": 456
    }
  ],
  "insights": [
    {
      "insight": "analysis of service gap or community need",
      "type": "service_gap|community_need|success_story|barrier|opportunity",
      "confidence": 0.8,
      "evidence": ["supporting text excerpts"]
    }
  ],
  "entities": [
    {
      "name": "entity name",
      "type": "person|organization|location|service|program",
      "category": "subcategory if applicable",
      "confidence": 0.9,
      "context": "context where mentioned"
    }
  ]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(response);

      return {
        themes: parsed.themes || [],
        quotes: parsed.quotes || [],
        insights: parsed.insights || [],
        entities: parsed.entities || []
      };

    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
      return {
        themes: [],
        quotes: [],
        insights: [],
        entities: []
      };
    }
  }

  /**
   * Split content into overlapping chunks
   */
  private static splitIntoChunks(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      let end = start + this.CHUNK_SIZE;

      if (end < content.length) {
        // Try to break at sentence boundary
        const lastPeriod = content.lastIndexOf('.', end);
        const lastNewline = content.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > start + this.CHUNK_SIZE * 0.7) {
          end = breakPoint + 1;
        }
      }

      chunks.push(content.slice(start, end));
      start = end - this.OVERLAP;
    }

    return chunks;
  }

  /**
   * Remove duplicate themes based on similarity
   */
  private static deduplicateThemes(themes: DocumentTheme[]): DocumentTheme[] {
    const unique: DocumentTheme[] = [];

    for (const theme of themes) {
      const isDuplicate = unique.some(existing =>
        this.calculateSimilarity(theme.theme_name, existing.theme_name) > 0.8
      );

      if (!isDuplicate) {
        unique.push(theme);
      }
    }

    return unique.sort((a: any, b: any) => b.confidence_score - a.confidence_score);
  }

  /**
   * Remove duplicate quotes
   */
  private static deduplicateQuotes(quotes: DocumentQuote[]): DocumentQuote[] {
    const unique: DocumentQuote[] = [];

    for (const quote of quotes) {
      const isDuplicate = unique.some(existing =>
        existing.quote_text.includes(quote.quote_text) ||
        quote.quote_text.includes(existing.quote_text)
      );

      if (!isDuplicate && quote.quote_text.length > 50) {
        unique.push(quote);
      }
    }

    return unique;
  }

  /**
   * Consolidate similar insights
   */
  private static consolidateInsights(insights: DocumentInsight[]): DocumentInsight[] {
    const grouped = new Map<string, DocumentInsight[]>();

    for (const insight of insights) {
      const key = `${insight.type}:${insight.insight.substring(0, 50)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(insight);
    }

    const consolidated: DocumentInsight[] = [];
    for (const [, group] of grouped) {
      if (group.length === 1) {
        consolidated.push(group[0]);
      } else {
        // Merge similar insights
        const merged = {
          insight: group[0].insight,
          type: group[0].type,
          confidence: Math.max(...group.map(g => g.confidence)),
          evidence: group.flatMap(g => g.evidence)
        };
        consolidated.push(merged);
      }
    }

    return consolidated.sort((a: any, b: any) => b.confidence - a.confidence);
  }

  /**
   * Remove duplicate entities
   */
  private static deduplicateEntities(entities: DocumentEntity[]): DocumentEntity[] {
    const unique: DocumentEntity[] = [];

    for (const entity of entities) {
      const isDuplicate = unique.some(existing =>
        existing.name.toLowerCase() === entity.name.toLowerCase() &&
        existing.type === entity.type
      );

      if (!isDuplicate) {
        unique.push(entity);
      }
    }

    return unique.sort((a: any, b: any) => b.confidence - a.confidence);
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
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
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}