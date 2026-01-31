/**
 * World-Class AI Service with Advanced Prompting Techniques
 * Implements multi-pass analysis, cross-chunk reasoning, and deep insights extraction
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from '@/lib/ai/config';

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Helper function to extract JSON from AI response
function extractJSON(text: string): any {
  // First try direct parsing
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }
    
    // Try to find JSON object in the text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    
    throw new Error('No valid JSON found in response');
  }
}

// Enhanced analysis result types
export interface DeepAnalysisResult {
  summary: string;
  themes: Array<{
    name: string;
    confidence: number;
    evidence: string;
    relatedThemes?: string[];
    implications?: string[];
  }>;
  quotes: Array<{
    text: string;
    context: string;
    significance: string;
    confidence: number;
    speaker?: string;
    sentiment?: number;
    category?: string;
    page?: number;
  }>;
  keywords: Array<{
    term: string;
    frequency: number;
    category: 'community' | 'technical' | 'emotional' | 'general' | 'action' | 'concept';
    context?: string;
    relatedTerms?: string[];
  }>;
  insights: Array<{
    text: string;
    category: string;
    importance: number;
    actionability?: number;
    evidence?: string;
    stakeholders?: string[];
  }>;
  entities?: Array<{
    name: string;
    type: 'person' | 'organization' | 'location' | 'concept' | 'event';
    mentions?: number;
    contexts?: string[];
    attributes?: Record<string, any>;
  }>;
  sentiment?: number;
  emotionalTone?: string[];
  contradictions?: Array<{
    statement1: string;
    statement2: string;
    explanation: string;
  }>;
}

export interface CrossChunkAnalysisResult {
  relationships: Array<{
    entity1: string;
    entity2: string;
    relationship: string;
    evidence: string[];
    strength: number;
  }>;
  trends: Array<{
    pattern: string;
    evidence: string[];
    significance: string;
  }>;
  contradictions: Array<{
    theme: string;
    contradiction: string;
    locations: number[];
  }>;
  consensus: Array<{
    theme: string;
    agreement: string;
    confidence: number;
  }>;
  insights: Array<{
    text: string;
    category: string;
    importance: number;
    basedOnChunks: number[];
  }>;
}

export interface DeepAnalysisOptions {
  chunkIndex: number;
  totalChunks: number;
  previousChunk?: string;
  nextChunk?: string;
  analysisDepth: 'standard' | 'deep' | 'exhaustive';
  numberOfPasses: number;
  extractEntities: boolean;
  detectSentiment: boolean;
  identifyContradictions: boolean;
  minThemes: number;
  minQuotes: number;
  minInsights: number;
}

/**
 * Perform deep, multi-pass analysis on a document chunk
 */
export async function performDeepAnalysis(
  chunkText: string,
  documentContext: string,
  options: DeepAnalysisOptions
): Promise<DeepAnalysisResult> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  // First pass: Comprehensive extraction
  const firstPassResult = await performFirstPass(chunkText, documentContext, options);
  
  // Second pass: Deep analysis and connections
  let result = firstPassResult;
  if (options.numberOfPasses >= 2) {
    result = await performSecondPass(chunkText, documentContext, firstPassResult, options);
  }
  
  // Third pass: Meta-analysis and implications
  if (options.numberOfPasses >= 3) {
    result = await performThirdPass(chunkText, documentContext, result, options);
  }

  return result;
}

/**
 * First pass: Comprehensive extraction
 */
async function performFirstPass(
  chunkText: string,
  documentContext: string,
  options: DeepAnalysisOptions
): Promise<DeepAnalysisResult> {
  const systemPrompt = `You are a world-class document analyst with expertise in extracting deep insights from text. Your analysis should be exhaustive, nuanced, and actionable.

Your task is to perform a comprehensive analysis of the provided text chunk, which is part ${options.chunkIndex + 1} of ${options.totalChunks} from a document titled "${documentContext}".

Key requirements:
1. Extract ALL themes, not just obvious ones - look for subtle patterns, underlying assumptions, and implicit messages
2. Identify EVERY significant quote - include context and explain why it matters
3. Generate actionable insights that go beyond surface-level observations
4. Extract all entities (people, organizations, locations, concepts, events)
5. Analyze emotional tone and sentiment
6. Identify keywords with their semantic relationships

Remember: This is a ${options.analysisDepth} analysis requiring ${options.minThemes}+ themes, ${options.minQuotes}+ quotes, and ${options.minInsights}+ insights minimum.`;

  const userPrompt = `Analyze this document chunk with extreme thoroughness:

${options.previousChunk ? `Previous context: ${options.previousChunk.substring(-200)}...` : ''}

CURRENT CHUNK:
${chunkText}

${options.nextChunk ? `Upcoming context: ...${options.nextChunk.substring(0, 200)}` : ''}

Provide your analysis in this exact JSON format:
{
  "summary": "Comprehensive 3-4 sentence summary capturing all key points",
  "themes": [
    {
      "name": "Theme name (be specific and descriptive)",
      "confidence": 0.0-1.0,
      "evidence": "Direct textual evidence supporting this theme",
      "relatedThemes": ["Other related themes"],
      "implications": ["What this theme implies or suggests"]
    }
  ],
  "quotes": [
    {
      "text": "Exact quote from the text",
      "context": "Surrounding context explaining the quote",
      "significance": "Why this quote is important and what it reveals",
      "confidence": 0.0-1.0,
      "speaker": "Who said it (if identifiable)",
      "sentiment": -1.0 to 1.0,
      "category": "type of quote (statement/question/recommendation/observation)"
    }
  ],
  "keywords": [
    {
      "term": "Important term or phrase",
      "frequency": count,
      "category": "community|technical|emotional|general|action|concept",
      "context": "How this term is used",
      "relatedTerms": ["semantically related terms"]
    }
  ],
  "insights": [
    {
      "text": "Actionable insight derived from the text",
      "category": "strategic|operational|cultural|technical|social",
      "importance": 1-10,
      "actionability": 1-10,
      "evidence": "What in the text supports this insight",
      "stakeholders": ["Who this insight affects"]
    }
  ],
  "entities": [
    {
      "name": "Entity name",
      "type": "person|organization|location|concept|event",
      "mentions": count,
      "contexts": ["How this entity is mentioned"],
      "attributes": {"role": "...", "significance": "..."}
    }
  ],
  "sentiment": -1.0 to 1.0,
  "emotionalTone": ["emotions detected in the text"],
  "contradictions": [
    {
      "statement1": "First contradictory statement",
      "statement2": "Second contradictory statement",
      "explanation": "How these contradict"
    }
  ]
}

IMPORTANT: 
- Find AT LEAST ${options.minThemes} distinct themes
- Extract AT LEAST ${options.minQuotes} significant quotes
- Generate AT LEAST ${options.minInsights} actionable insights
- Look for subtle, implicit, and nuanced elements
- Consider cultural, social, technical, and emotional dimensions
- Identify patterns, trends, and anomalies
- Extract actionable intelligence`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    const provider = getAIProvider();
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 8192,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      return extractJSON(content.text) as DeepAnalysisResult;
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    return extractJSON(response) as DeepAnalysisResult;
  } catch (error) {
    console.error('First pass analysis error:', error);
    throw error;
  }
}

/**
 * Second pass: Deep analysis and connections
 */
async function performSecondPass(
  chunkText: string,
  _documentContext: string,
  firstPassResult: DeepAnalysisResult,
  options: DeepAnalysisOptions
): Promise<DeepAnalysisResult> {
  const systemPrompt = `You are a world-class analyst performing a second, deeper pass of analysis. You have the results from the first pass and must now:
1. Find additional themes that were missed
2. Identify deeper connections between themes
3. Extract more nuanced insights
4. Find additional significant quotes
5. Identify patterns and relationships`;

  const userPrompt = `Perform a second, deeper analysis of this text chunk.

First pass found:
- ${firstPassResult.themes.length} themes
- ${firstPassResult.quotes.length} quotes  
- ${firstPassResult.insights.length} insights

Your task: Find what was MISSED. Look deeper. Consider:
- Implicit meanings and subtext
- Power dynamics and relationships
- Unstated assumptions
- Future implications
- Hidden opportunities and risks
- Cross-cutting themes
- Minority viewpoints
- Edge cases and exceptions

Text chunk:
${chunkText}

Add to the existing analysis with the same JSON structure, finding AT LEAST:
- ${Math.max(0, options.minThemes - firstPassResult.themes.length)} more themes
- ${Math.max(0, options.minQuotes - firstPassResult.quotes.length)} more quotes
- ${Math.max(0, options.minInsights - firstPassResult.insights.length)} more insights

Focus on depth, nuance, and actionability.`;

  try {
    const additionalResults = await callAI(systemPrompt, userPrompt);
    
    // Merge results
    return mergeAnalysisResults(firstPassResult, additionalResults);
  } catch (error) {
    console.error('Second pass analysis error:', error);
    return firstPassResult;
  }
}

/**
 * Third pass: Meta-analysis and implications
 */
async function performThirdPass(
  chunkText: string,
  _documentContext: string,
  secondPassResult: DeepAnalysisResult,
  _options: DeepAnalysisOptions
): Promise<DeepAnalysisResult> {
  const systemPrompt = `You are performing a final meta-analysis pass. Your goal is to:
1. Synthesize all findings into higher-order insights
2. Identify systemic patterns and root causes
3. Generate strategic recommendations
4. Predict future implications
5. Identify intervention points`;

  const userPrompt = `Perform a meta-analysis of the findings from previous passes.

Current analysis has found:
${secondPassResult.themes.length} themes, ${secondPassResult.quotes.length} quotes, ${secondPassResult.insights.length} insights

Your task:
1. What meta-themes emerge from combining multiple themes?
2. What systemic issues or opportunities are revealed?
3. What are the 2nd and 3rd order implications?
4. What early warning signals are present?
5. What leverage points exist for change?
6. What contradictions reveal deeper truths?

Generate additional HIGH-LEVEL insights that synthesize the analysis.

Text chunk for reference:
${chunkText}`;

  try {
    const metaResults = await callAI(systemPrompt, userPrompt);
    
    // Add meta-insights to existing results
    return {
      ...secondPassResult,
      insights: [
        ...secondPassResult.insights,
        ...metaResults.insights.map((i: any) => ({
          ...i,
          category: 'meta-' + i.category
        }))
      ]
    };
  } catch (error) {
    console.error('Third pass analysis error:', error);
    return secondPassResult;
  }
}

/**
 * Perform cross-chunk analysis to find patterns and relationships
 */
export async function performCrossChunkAnalysis(
  chunks: string[],
  chunkAnalyses: DeepAnalysisResult[]
): Promise<CrossChunkAnalysisResult> {
  const systemPrompt = `You are performing cross-chunk analysis to identify patterns, relationships, and contradictions across an entire document. Your analysis should reveal:
1. Relationships between entities across chunks
2. Evolving themes and narratives
3. Contradictions and inconsistencies
4. Consensus views and contested areas
5. Document-wide insights`;

  // Prepare aggregated data for analysis
  const allThemes = chunkAnalyses.flatMap((a, i) => 
    a.themes.map(t => ({ ...t, chunkIndex: i }))
  );
  const allEntities = chunkAnalyses.flatMap((a, i) => 
    (a.entities || []).map(e => ({ ...e, chunkIndex: i }))
  );
  const allInsights = chunkAnalyses.flatMap((a, i) => 
    a.insights.map(ins => ({ ...ins, chunkIndex: i }))
  );

  const userPrompt = `Analyze patterns across ${chunks.length} document chunks.

Document-wide data:
- ${allThemes.length} total themes across chunks
- ${allEntities.length} total entities identified
- ${allInsights.length} total insights generated

Themes by chunk: ${JSON.stringify(allThemes.map(t => ({ theme: t.name, chunk: t.chunkIndex })))}
Entities by chunk: ${JSON.stringify(allEntities.map(e => ({ entity: e.name, type: e.type, chunk: e.chunkIndex })))}

Identify:
1. RELATIONSHIPS: How do entities relate to each other across the document?
2. TRENDS: What patterns emerge from chunk to chunk?
3. CONTRADICTIONS: Where does the document contradict itself?
4. CONSENSUS: What themes appear consistently?
5. SYNTHESIS: What document-wide insights emerge?

Provide analysis in this JSON format:
{
  "relationships": [
    {
      "entity1": "name",
      "entity2": "name", 
      "relationship": "description of relationship",
      "evidence": ["quotes or references"],
      "strength": 0.0-1.0
    }
  ],
  "trends": [
    {
      "pattern": "description of trend",
      "evidence": ["supporting evidence"],
      "significance": "why this matters"
    }
  ],
  "contradictions": [
    {
      "theme": "topic area",
      "contradiction": "description of contradiction",
      "locations": [chunk indices]
    }
  ],
  "consensus": [
    {
      "theme": "theme name",
      "agreement": "what is agreed upon",
      "confidence": 0.0-1.0
    }
  ],
  "insights": [
    {
      "text": "document-wide insight",
      "category": "strategic|operational|systemic",
      "importance": 1-10,
      "basedOnChunks": [chunk indices]
    }
  ]
}`;

  try {
    // const modelConfig = aiConfig.getModelConfig();
    return await callAI(systemPrompt, userPrompt) as CrossChunkAnalysisResult;
  } catch (error) {
    console.error('Cross-chunk analysis error:', error);
    return {
      relationships: [],
      trends: [],
      contradictions: [],
      consensus: [],
      insights: []
    };
  }
}

/**
 * Generate comprehensive document summary
 */
export async function generateComprehensiveSummary(
  _fullText: string,
  chunkAnalyses: DeepAnalysisResult[],
  crossChunkAnalysis?: CrossChunkAnalysisResult,
  documentTitle?: string
): Promise<{
  summary: string;
  executiveSummary: string;
  keyTakeaways: string[];
}> {
  // Aggregate all findings
  const allThemes = chunkAnalyses.flatMap(a => a.themes);
  const allInsights = chunkAnalyses.flatMap(a => a.insights);
  const topQuotes = chunkAnalyses
    .flatMap(a => a.quotes)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  const systemPrompt = `You are creating a world-class document summary that captures the essence, insights, and implications of the analysis. Your summary should be:
1. Comprehensive yet concise
2. Action-oriented
3. Strategic in perspective
4. Clear about implications`;

  const userPrompt = `Create a comprehensive summary of this document${documentTitle ? ` titled "${documentTitle}"` : ''}.

Analysis findings:
- ${allThemes.length} key themes identified
- ${allInsights.length} insights generated
- ${crossChunkAnalysis?.relationships.length || 0} entity relationships mapped
- ${crossChunkAnalysis?.trends.length || 0} trends identified

Top themes: ${allThemes.slice(0, 10).map(t => t.name).join(', ')}

Top insights: ${allInsights.slice(0, 5).map(i => i.text).join('; ')}

Key quotes: ${topQuotes.slice(0, 3).map(q => `"${q.text}"`).join('; ')}

Create:
1. A comprehensive summary (3-5 paragraphs) covering all major findings
2. An executive summary (1 paragraph) with the most critical points
3. 5-7 key takeaways that are actionable and specific

Format as JSON:
{
  "summary": "comprehensive summary text",
  "executiveSummary": "one paragraph executive summary",
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...]
}`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summary: 'Summary generation failed',
      executiveSummary: 'Summary generation failed',
      keyTakeaways: []
    };
  }
}

/**
 * Helper function to call AI with proper error handling
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
  const provider = getAIProvider();
  const modelConfig = aiConfig.getModelConfig();

  if (provider === 'anthropic') {
    const completion = await anthropic!.messages.create({
      model: modelConfig.model,
      max_tokens: 8192,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const content = completion.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    
    return extractJSON(content.text);
  }

  const completion = await openai!.chat.completions.create({
    model: modelConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 8192,
    response_format: { type: 'json_object' }
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI service');
  }

  return extractJSON(response);
}

/**
 * Merge analysis results from multiple passes
 */
function mergeAnalysisResults(
  first: DeepAnalysisResult,
  second: DeepAnalysisResult
): DeepAnalysisResult {
  return {
    summary: second.summary || first.summary,
    themes: [...first.themes, ...second.themes],
    quotes: [...first.quotes, ...second.quotes],
    keywords: mergeKeywords(first.keywords, second.keywords),
    insights: [...first.insights, ...second.insights],
    entities: mergeEntities(first.entities || [], second.entities || []),
    sentiment: (first.sentiment || 0 + (second.sentiment || 0)) / 2,
    emotionalTone: [...new Set([...(first.emotionalTone || []), ...(second.emotionalTone || [])])],
    contradictions: [...(first.contradictions || []), ...(second.contradictions || [])]
  };
}

function mergeKeywords(first: any[], second: any[]): any[] {
  const keywordMap = new Map();
  
  [...first, ...second].forEach(kw => {
    const existing = keywordMap.get(kw.term);
    if (existing) {
      existing.frequency += kw.frequency;
    } else {
      keywordMap.set(kw.term, { ...kw });
    }
  });
  
  return Array.from(keywordMap.values());
}

function mergeEntities(first: any[], second: any[]): any[] {
  const entityMap = new Map();
  
  [...first, ...second].forEach(entity => {
    const key = `${entity.type}:${entity.name}`;
    const existing = entityMap.get(key);
    if (existing) {
      existing.mentions = (existing.mentions || 0) + (entity.mentions || 0);
      existing.contexts = [...(existing.contexts || []), ...(entity.contexts || [])];
    } else {
      entityMap.set(key, { ...entity });
    }
  });
  
  return Array.from(entityMap.values());
}

function getAIProvider() {
  const modelConfig = aiConfig.getModelConfig();
  if (modelConfig.provider === 'anthropic' && anthropic) {
    return 'anthropic';
  }
  if (modelConfig.provider === 'openai' && openai) {
    return 'openai';
  }
  if (anthropic) return 'anthropic';
  if (openai) return 'openai';
  return null;
}