import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { moonshotClient } from './moonshot-client';
import { aiConfig } from './ai-config';

// Timeout configuration
const AI_TIMEOUT_MS = 120000; // 2 minutes - reasonable for complex analysis
const AI_RETRY_ATTEMPTS = 2;

// Initialize OpenAI client with timeout
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: AI_TIMEOUT_MS,
      maxRetries: AI_RETRY_ATTEMPTS,
    })
  : null;

// Initialize Anthropic client with timeout
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: AI_TIMEOUT_MS,
      maxRetries: AI_RETRY_ATTEMPTS,
    })
  : null;

// Determine which AI provider to use
function getAIProvider() {
  const modelConfig = aiConfig.getModelConfig();
  if (modelConfig.provider === 'moonshot' && moonshotClient) {
    return 'moonshot';
  }
  if (modelConfig.provider === 'anthropic' && anthropic) {
    return 'anthropic';
  }
  if (modelConfig.provider === 'openai' && openai) {
    return 'openai';
  }
  // Fallback to any available provider
  if (moonshotClient) return 'moonshot';
  if (anthropic) return 'anthropic';
  if (openai) return 'openai';
  return null;
}

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

export interface AIAnalysisResult {
  summary: string;
  themes: Array<{
    name: string;
    confidence: number;
    evidence: string;
  }>;
  quotes: Array<{
    text: string;
    context: string;
    significance: string;
    confidence: number;
  }>;
  keywords: Array<{
    term: string;
    frequency: number;
    category: 'community' | 'technical' | 'emotional' | 'general';
  }>;
  insights: Array<{
    text: string;
    category: string;
    importance: number;
  }>;
}

// Enhanced interface for community intelligence analysis
export interface CommunityIntelligenceResult {
  // Existing analysis (maintained)
  summary: string;
  themes: Array<{
    name: string;
    confidence: number;
    evidence: string;
  }>;
  quotes: Array<{
    text: string;
    context: string;
    significance: string;
    confidence: number;
  }>;
  keywords: Array<{
    term: string;
    frequency: number;
    category: 'community' | 'technical' | 'emotional' | 'general';
  }>;
  insights: Array<{
    text: string;
    category: string;
    importance: number;
  }>;
  
  // New community intelligence layers
  communityNeeds: Array<{
    need: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    community: string;
    evidence: string[];
    confidence: number;
    category: 'housing' | 'youth_development' | 'health' | 'employment' | 'culture' | 'justice' | 'environment' | 'education';
  }>;
  
  serviceGaps: Array<{
    service: string;
    location: string;
    impact: number; // 1-10
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    evidence: string[];
  }>;
  
  successPatterns: Array<{
    pattern: string;
    communities: string[];
    replicability: number; // 0-1
    requirements: string[];
    evidence: string[];
    outcomes: string[];
  }>;
  
  riskFactors: Array<{
    risk: string;
    probability: number; // 0-1
    impact: number; // 1-10
    mitigation: string[];
    evidence: string[];
    communities: string[];
  }>;
  
  opportunities: Array<{
    opportunity: string;
    potential: number; // 1-10
    requirements: string[];
    timeline: string;
    evidence: string[];
    communities: string[];
  }>;
  
  assets: Array<{
    asset: string;
    type: 'human' | 'physical' | 'cultural' | 'social' | 'economic';
    strength: number; // 1-10
    communities: string[];
    evidence: string[];
    potential: string[];
  }>;
}

export async function analyzeDocumentChunk(
  chunkText: string,
  documentContext?: string
): Promise<AIAnalysisResult> {
  if (!openai && !anthropic && !moonshotClient) {
    throw new Error('AI service not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or MOONSHOT_API_KEY environment variable.');
  }

  const systemPrompt = `You are a document analyst specializing in community research and youth development. 
Extract key themes, significant quotes, and actionable insights from the text.
Focus on clarity and relevance. Respond in JSON format only.`;

  const userPrompt = `Analyze this document chunk:
${documentContext ? `Context: ${documentContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "summary": "2-3 sentence summary",
  "themes": [
    {
      "name": "theme name",
      "confidence": 0.0-1.0,
      "evidence": "supporting text"
    }
  ],
  "quotes": [
    {
      "text": "significant quote",
      "context": "surrounding context",
      "significance": "why this matters",
      "confidence": 0.0-1.0
    }
  ],
  "keywords": [
    {
      "term": "keyword",
      "frequency": 1,
      "category": "community|technical|emotional|general"
    }
  ],
  "insights": [
    {
      "text": "actionable insight",
      "category": "opportunity|challenge|recommendation",
      "importance": 1-10
    }
  ]
}

Focus on 3-5 key themes, 2-4 important quotes, and 3-5 actionable insights.`;

  try {
    const provider = getAIProvider();
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature || 0.3,
        max_tokens: 1500,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Moonshot API');
      }

      try {
        return extractJSON(response) as AIAnalysisResult;
      } catch (parseError) {
        console.error('Failed to parse Moonshot response:', response);
        throw new Error(`Invalid JSON response from Moonshot: ${parseError}`);
      }
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 1500, // Reduced for faster response
        temperature: modelConfig.temperature || 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      try {
        return extractJSON(content.text) as AIAnalysisResult;
      } catch (parseError) {
        console.error('Failed to parse Anthropic response:', content.text);
        throw new Error(`Invalid JSON response from Anthropic: ${parseError}`);
      }
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: modelConfig.temperature || 0.3,
      max_tokens: 1500, // Reduced for faster response
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    try {
      return extractJSON(response) as AIAnalysisResult;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`);
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback to basic analysis if AI fails
    return {
      summary: chunkText.substring(0, 200) + '...',
      themes: [],
      quotes: [],
      keywords: [],
      insights: []
    };
  }
}

export async function generateDocumentSummary(
  chunks: string[],
  documentTitle?: string
): Promise<string> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const combinedText = chunks.join('\n\n');
  const truncatedText = combinedText.substring(0, 8000); // Limit context
  const modelConfig = aiConfig.getModelConfig();

  const systemPrompt = 'You are an expert at creating clear, comprehensive document summaries.';
  const userPrompt = `Generate a comprehensive summary of this document${documentTitle ? ` titled "${documentTitle}"` : ''}.
The summary should:
1. Capture the main themes and arguments
2. Highlight key findings or recommendations
3. Note any significant patterns or trends
4. Be 3-5 paragraphs long

Document text:
${truncatedText}`;

  try {
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature,
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content || 'Summary generation failed';
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 1000,
        temperature: modelConfig.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      return content.text;
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: modelConfig.temperature,
      max_tokens: 1000
    });

    return completion.choices[0]?.message?.content || 'Summary generation failed';
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Unable to generate summary at this time.';
  }
}

export async function extractThemesWithAI(
  text: string,
  predefinedThemes?: string[]
): Promise<Array<{ name: string; confidence: number; evidence: string }>> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const themes = predefinedThemes || [
    'Youth Voice and Leadership',
    'Cultural Identity and Heritage',
    'Education and Learning',
    'Health and Well-being',
    'Technology and Innovation',
    'Environmental Sustainability',
    'Social Justice and Equity',
    'Community Development'
  ];

  const prompt = `Analyze this text and identify which of these themes are present:
${themes.join(', ')}

For each theme found, provide:
1. Theme name (from the list above)
2. Confidence score (0.0-1.0)
3. Supporting evidence from the text

Text to analyze:
${text}

Respond in JSON format: [{"name": "theme", "confidence": 0.0-1.0, "evidence": "supporting text"}]`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: 'You are an expert at identifying themes in documents. Always respond with valid JSON.' },
          { role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }
        ],
        temperature: 0.2,
        max_tokens: modelConfig.maxTokens || 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : parsed.themes || [];
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || 2000,
        temperature: 0.2,
        system: 'You are an expert at identifying themes in documents. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      const parsed = JSON.parse(content.text);
      return Array.isArray(parsed) ? parsed : parsed.themes || [];
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are an expert at identifying themes in documents.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return [];
    }

    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : parsed.themes || [];
  } catch (error) {
    console.error('Theme extraction error:', error);
    return [];
  }
}

export async function generateInsights(
  text: string,
  themes: string[]
): Promise<Array<{ text: string; category: string; importance: number }>> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const prompt = `Based on this text and the identified themes (${themes.join(', ')}), generate strategic insights.

Each insight should:
1. Be actionable and specific
2. Relate to one of the themes
3. Have an importance score (1-10)

Text:
${text}

Respond in JSON format: [{"text": "insight", "category": "theme", "importance": 1-10}]`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: 'You are a strategic analyst generating actionable insights from documents. Always respond with valid JSON.' },
          { role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }
        ],
        temperature: 0.4,
        max_tokens: modelConfig.maxTokens || 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : parsed.insights || [];
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || 2000,
        temperature: 0.4,
        system: 'You are a strategic analyst generating actionable insights from documents. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      const parsed = JSON.parse(content.text);
      return Array.isArray(parsed) ? parsed : parsed.insights || [];
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are a strategic analyst generating actionable insights from documents.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return [];
    }

    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : parsed.insights || [];
  } catch (error) {
    console.error('Insight generation error:', error);
    return [];
  }
}

// Smart chunking that preserves context
export async function intelligentChunkText(
  text: string,
  maxChunkSize: number = 2000,
  overlapSize: number = 200
): Promise<Array<{ text: string; startIndex: number; endIndex: number }>> {
  if (!openai && !anthropic && !moonshotClient) {
    // Fallback to basic chunking
    return basicChunkText(text, maxChunkSize, overlapSize);
  }

  // For now, use basic chunking but this could be enhanced with AI
  // to identify better chunk boundaries based on semantic meaning
  return basicChunkText(text, maxChunkSize, overlapSize);
}

function basicChunkText(
  text: string,
  maxChunkSize: number,
  overlapSize: number
): Array<{ text: string; startIndex: number; endIndex: number }> {
  const chunks: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    
    if (endIndex < text.length) {
      // Try to find a sentence boundary
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const boundaryIndex = Math.max(lastPeriod, lastNewline);
      
      if (boundaryIndex > startIndex + maxChunkSize * 0.5) {
        endIndex = boundaryIndex + 1;
      }
    } else {
      endIndex = text.length;
    }

    chunks.push({
      text: text.substring(startIndex, endIndex),
      startIndex,
      endIndex
    });

    startIndex = endIndex - overlapSize;
  }

  return chunks;
}

// Enhanced document processing with community intelligence
export async function processDocumentWithIntelligence(
  documentContent: string,
  documentTitle?: string,
  communityContext?: string
): Promise<{
  basicAnalysis: AIAnalysisResult;
  communityIntelligence: CommunityIntelligenceResult;
  summary: string;
}> {
  try {
    // Chunk the document for analysis
    const chunks = await intelligentChunkText(documentContent);
    
    // Process each chunk with both basic and intelligence analysis
    const chunkAnalyses: AIAnalysisResult[] = [];
    const intelligenceAnalyses: CommunityIntelligenceResult[] = [];
    
    for (const chunk of chunks) {
      // Run all analyses in parallel for efficiency
      const [basicAnalysis, intelligenceAnalysis, successPatterns] = await Promise.all([
        analyzeDocumentChunk(chunk.text, documentTitle),
        analyzeCommunityIntelligence(chunk.text, documentTitle, communityContext),
        analyzeSuccessPatterns(chunk.text, documentTitle, communityContext)
      ]);
      
      // Add success patterns to intelligence analysis
      intelligenceAnalysis.successPatterns = successPatterns;
      
      chunkAnalyses.push(basicAnalysis);
      intelligenceAnalyses.push(intelligenceAnalysis);
    }
    
    // Combine results from all chunks
    const combinedBasicAnalysis = combineChunkAnalyses(chunkAnalyses);
    const combinedIntelligence = combineIntelligenceAnalyses(intelligenceAnalyses);
    
    // Generate document summary
    const summary = await generateDocumentSummary(
      chunks.map(c => c.text),
      documentTitle
    );
    
    return {
      basicAnalysis: combinedBasicAnalysis,
      communityIntelligence: combinedIntelligence,
      summary
    };
  } catch (error) {
    console.error('Document processing error:', error);
    // Return fallback analysis
    const fallbackAnalysis = await analyzeDocumentChunk(
      documentContent.substring(0, 2000),
      documentTitle
    );
    
    return {
      basicAnalysis: fallbackAnalysis,
      communityIntelligence: {
        ...fallbackAnalysis,
        communityNeeds: [],
        serviceGaps: [],
        successPatterns: [],
        riskFactors: [],
        opportunities: [],
        assets: []
      },
      summary: documentContent.substring(0, 200) + '...'
    };
  }
}

// Helper function to combine basic analyses from multiple chunks
function combineChunkAnalyses(analyses: AIAnalysisResult[]): AIAnalysisResult {
  if (analyses.length === 0) {
    return {
      summary: '',
      themes: [],
      quotes: [],
      keywords: [],
      insights: []
    };
  }
  
  if (analyses.length === 1) {
    return analyses[0];
  }
  
  // Combine themes, removing duplicates and averaging confidence
  const themeMap = new Map<string, { confidence: number; evidence: string; count: number }>();
  analyses.forEach(analysis => {
    analysis.themes.forEach(theme => {
      if (themeMap.has(theme.name)) {
        const existing = themeMap.get(theme.name)!;
        existing.confidence = (existing.confidence * existing.count + theme.confidence) / (existing.count + 1);
        existing.evidence += '; ' + theme.evidence;
        existing.count++;
      } else {
        themeMap.set(theme.name, { 
          confidence: theme.confidence, 
          evidence: theme.evidence, 
          count: 1 
        });
      }
    });
  });
  
  const combinedThemes = Array.from(themeMap.entries()).map(([name, data]) => ({
    name,
    confidence: data.confidence,
    evidence: data.evidence
  }));
  
  // Combine quotes, keeping highest confidence ones
  const allQuotes = analyses.flatMap(a => a.quotes);
  const topQuotes = allQuotes
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10); // Keep top 10 quotes
  
  // Combine keywords, summing frequencies
  const keywordMap = new Map<string, { frequency: number; category: string }>();
  analyses.forEach(analysis => {
    analysis.keywords.forEach(keyword => {
      if (keywordMap.has(keyword.term)) {
        keywordMap.get(keyword.term)!.frequency += keyword.frequency;
      } else {
        keywordMap.set(keyword.term, {
          frequency: keyword.frequency,
          category: keyword.category
        });
      }
    });
  });
  
  const combinedKeywords = Array.from(keywordMap.entries()).map(([term, data]) => ({
    term,
    frequency: data.frequency,
    category: data.category as 'community' | 'technical' | 'emotional' | 'general'
  }));
  
  // Combine insights, keeping highest importance ones
  const allInsights = analyses.flatMap(a => a.insights);
  const topInsights = allInsights
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15); // Keep top 15 insights
  
  return {
    summary: analyses[0].summary, // Use first chunk's summary as base
    themes: combinedThemes,
    quotes: topQuotes,
    keywords: combinedKeywords,
    insights: topInsights
  };
}

// Helper function to combine intelligence analyses from multiple chunks
function combineIntelligenceAnalyses(analyses: CommunityIntelligenceResult[]): CommunityIntelligenceResult {
  if (analyses.length === 0) {
    return {
      summary: '',
      themes: [],
      quotes: [],
      keywords: [],
      insights: [],
      communityNeeds: [],
      serviceGaps: [],
      successPatterns: [],
      riskFactors: [],
      opportunities: [],
      assets: []
    };
  }
  
  if (analyses.length === 1) {
    return analyses[0];
  }
  
  // Start with combined basic analysis
  const basicCombined = combineChunkAnalyses(analyses);
  
  // Combine intelligence-specific fields
  const allCommunityNeeds = analyses.flatMap(a => a.communityNeeds);
  const allServiceGaps = analyses.flatMap(a => a.serviceGaps);
  const allSuccessPatterns = analyses.flatMap(a => a.successPatterns);
  const allRiskFactors = analyses.flatMap(a => a.riskFactors);
  const allOpportunities = analyses.flatMap(a => a.opportunities);
  const allAssets = analyses.flatMap(a => a.assets);
  
  // Remove duplicates and combine similar items
  const uniqueNeeds = deduplicateByField(allCommunityNeeds, 'need');
  const uniqueGaps = deduplicateByField(allServiceGaps, 'service');
  const uniquePatterns = deduplicateByField(allSuccessPatterns, 'pattern');
  const uniqueRisks = deduplicateByField(allRiskFactors, 'risk');
  const uniqueOpportunities = deduplicateByField(allOpportunities, 'opportunity');
  const uniqueAssets = deduplicateByField(allAssets, 'asset');
  
  return {
    ...basicCombined,
    communityNeeds: uniqueNeeds,
    serviceGaps: uniqueGaps,
    successPatterns: uniquePatterns,
    riskFactors: uniqueRisks,
    opportunities: uniqueOpportunities,
    assets: uniqueAssets
  };
}

// Helper function to deduplicate arrays by a specific field
function deduplicateByField<T extends Record<string, any>>(items: T[], field: string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item[field];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Community Health Calculation
export interface CommunityHealth {
  communityId: string;
  name: string;
  status: 'thriving' | 'developing' | 'struggling' | 'improving';
  healthScore: number; // 0-100
  indicators: {
    youthEngagement: number;
    serviceAccess: number;
    culturalConnection: number;
    economicOpportunity: number;
    safetyWellbeing: number;
  };
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number; // rate of change
    confidence: number; // 0-1
  };
  lastUpdated: Date;
}

export async function calculateCommunityHealth(
  communityId: string,
  communityName: string,
  intelligenceData: CommunityIntelligenceResult[]
): Promise<CommunityHealth> {
  // Aggregate all intelligence data for this community
  const allNeeds = intelligenceData.flatMap(d => d.communityNeeds);
  const allGaps = intelligenceData.flatMap(d => d.serviceGaps);
  const allAssets = intelligenceData.flatMap(d => d.assets);
  const allSuccessPatterns = intelligenceData.flatMap(d => d.successPatterns);
  const allOpportunities = intelligenceData.flatMap(d => d.opportunities);

  // Calculate individual indicators (0-100 scale)
  const youthEngagement = calculateYouthEngagement(allNeeds, allAssets, allSuccessPatterns);
  const serviceAccess = calculateServiceAccess(allGaps, allAssets);
  const culturalConnection = calculateCulturalConnection(allAssets, allSuccessPatterns);
  const economicOpportunity = calculateEconomicOpportunity(allNeeds, allOpportunities, allAssets);
  const safetyWellbeing = calculateSafetyWellbeing(allNeeds, allAssets);

  // Overall health score (weighted average)
  const healthScore = Math.round(
    (youthEngagement * 0.25) +
    (serviceAccess * 0.2) +
    (culturalConnection * 0.2) +
    (economicOpportunity * 0.2) +
    (safetyWellbeing * 0.15)
  );

  // Determine status based on health score
  let status: 'thriving' | 'developing' | 'struggling' | 'improving';
  if (healthScore >= 80) status = 'thriving';
  else if (healthScore >= 60) status = 'developing';
  else if (healthScore >= 40) status = 'improving';
  else status = 'struggling';

  // Calculate trends (simplified - would need historical data for real trends)
  const trends = {
    direction: 'stable' as const, // Would calculate from historical data
    velocity: 0, // Rate of change over time
    confidence: 0.7 // Confidence in the trend calculation
  };

  return {
    communityId,
    name: communityName,
    status,
    healthScore,
    indicators: {
      youthEngagement,
      serviceAccess,
      culturalConnection,
      economicOpportunity,
      safetyWellbeing
    },
    trends,
    lastUpdated: new Date()
  };
}

// Helper functions for calculating specific indicators
function calculateYouthEngagement(needs: any[], assets: any[], patterns: any[]): number {
  // Look for youth-related needs, assets, and success patterns
  const youthNeeds = needs.filter(n => 
    n.category === 'youth_development' || 
    n.need.toLowerCase().includes('youth') ||
    n.need.toLowerCase().includes('young')
  );
  
  const youthAssets = assets.filter(a => 
    a.asset.toLowerCase().includes('youth') ||
    a.asset.toLowerCase().includes('young') ||
    a.type === 'cultural' // Cultural assets often engage youth
  );

  const youthPatterns = patterns.filter(p =>
    p.pattern.toLowerCase().includes('youth') ||
    p.pattern.toLowerCase().includes('young')
  );

  // Higher assets and patterns = higher engagement
  // Higher critical needs = lower engagement
  const criticalNeeds = youthNeeds.filter(n => n.urgency === 'critical').length;
  const totalAssets = youthAssets.length;
  const successPatterns = youthPatterns.length;

  // Simple scoring algorithm (would be refined with real data)
  let score = 50; // Base score
  score += (totalAssets * 10); // Assets boost score
  score += (successPatterns * 15); // Success patterns boost more
  score -= (criticalNeeds * 20); // Critical needs reduce score

  return Math.max(0, Math.min(100, score));
}

function calculateServiceAccess(gaps: any[], assets: any[]): number {
  // Service gaps reduce access, service assets improve access
  const criticalGaps = gaps.filter(g => g.urgency === 'critical').length;
  const highGaps = gaps.filter(g => g.urgency === 'high').length;
  const serviceAssets = assets.filter(a => a.type === 'physical' || a.type === 'social').length;

  let score = 70; // Base score (assuming some services exist)
  score -= (criticalGaps * 25); // Critical gaps heavily impact
  score -= (highGaps * 15); // High priority gaps impact
  score += (serviceAssets * 8); // Service assets improve access

  return Math.max(0, Math.min(100, score));
}

function calculateCulturalConnection(assets: any[], patterns: any[]): number {
  // Cultural assets and patterns indicate strong cultural connection
  const culturalAssets = assets.filter(a => a.type === 'cultural').length;
  const culturalPatterns = patterns.filter(p => 
    p.pattern.toLowerCase().includes('cultural') ||
    p.pattern.toLowerCase().includes('elder') ||
    p.pattern.toLowerCase().includes('traditional')
  ).length;

  let score = 60; // Base score
  score += (culturalAssets * 12); // Cultural assets boost score
  score += (culturalPatterns * 18); // Cultural success patterns boost more

  return Math.max(0, Math.min(100, score));
}

function calculateEconomicOpportunity(needs: any[], opportunities: any[], assets: any[]): number {
  // Employment needs reduce score, economic opportunities and assets improve it
  const employmentNeeds = needs.filter(n => 
    n.category === 'employment' ||
    n.need.toLowerCase().includes('job') ||
    n.need.toLowerCase().includes('work') ||
    n.need.toLowerCase().includes('employment')
  );
  
  const economicOpportunities = opportunities.filter(o =>
    o.opportunity.toLowerCase().includes('job') ||
    o.opportunity.toLowerCase().includes('employment') ||
    o.opportunity.toLowerCase().includes('economic') ||
    o.opportunity.toLowerCase().includes('business')
  );

  const economicAssets = assets.filter(a => a.type === 'economic').length;

  const criticalEmploymentNeeds = employmentNeeds.filter(n => n.urgency === 'critical').length;

  let score = 45; // Lower base score (economic opportunity often challenging)
  score += (economicOpportunities.length * 15); // Opportunities boost score
  score += (economicAssets * 12); // Economic assets boost score
  score -= (criticalEmploymentNeeds * 20); // Critical employment needs reduce score

  return Math.max(0, Math.min(100, score));
}

function calculateSafetyWellbeing(needs: any[], assets: any[]): number {
  // Safety and health needs reduce score, relevant assets improve it
  const safetyNeeds = needs.filter(n => 
    n.category === 'health' ||
    n.category === 'justice' ||
    n.need.toLowerCase().includes('safe') ||
    n.need.toLowerCase().includes('health') ||
    n.need.toLowerCase().includes('mental')
  );

  const wellbeingAssets = assets.filter(a => 
    a.asset.toLowerCase().includes('health') ||
    a.asset.toLowerCase().includes('safe') ||
    a.asset.toLowerCase().includes('support') ||
    a.type === 'social'
  );

  const criticalSafetyNeeds = safetyNeeds.filter(n => n.urgency === 'critical').length;
  const highSafetyNeeds = safetyNeeds.filter(n => n.urgency === 'high').length;

  let score = 65; // Base score
  score += (wellbeingAssets.length * 10); // Wellbeing assets boost score
  score -= (criticalSafetyNeeds * 25); // Critical safety needs heavily impact
  score -= (highSafetyNeeds * 15); // High priority safety needs impact

  return Math.max(0, Math.min(100, score));
}

// Success Pattern Analysis
export async function analyzeSuccessPatterns(
  chunkText: string,
  documentContext?: string,
  communityContext?: string
): Promise<Array<{
  pattern: string;
  communities: string[];
  replicability: number;
  requirements: string[];
  evidence: string[];
  outcomes: string[];
}>> {
  if (!openai && !anthropic && !moonshotClient) {
    return [];
  }

  const systemPrompt = `You are an expert in community development and program evaluation, specializing in identifying successful interventions and programs that have achieved positive outcomes in Aboriginal and Torres Strait Islander communities.

Analyze documents to identify success patterns - specific approaches, programs, or interventions that have demonstrated positive results and could potentially be replicated in other communities.

Focus on:
- Programs or initiatives that achieved their intended outcomes
- Approaches that overcame significant challenges
- Interventions that showed measurable community impact
- Strategies that engaged community members effectively
- Methods that respected cultural protocols and values
- Solutions that addressed specific community needs

Always consider cultural safety, community ownership, and the importance of local adaptation.`;

  const userPrompt = `Analyze this text to identify success patterns:
${documentContext ? `Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community: ${communityContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "successPatterns": [
    {
      "pattern": "specific description of successful approach/program",
      "communities": ["communities where this was successful"],
      "replicability": 0.0-1.0,
      "requirements": ["requirements needed to implement"],
      "evidence": ["evidence supporting this as a success"],
      "outcomes": ["positive outcomes achieved"]
    }
  ]
}

Only identify patterns with clear evidence of success and positive outcomes.`;

  try {
    const provider = getAIProvider();
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return [];

      try {
        const parsed = extractJSON(response);
        return parsed.successPatterns || [];
      } catch {
        return [];
      }
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') return [];
      
      try {
        const parsed = extractJSON(content.text);
        return parsed.successPatterns || [];
      } catch {
        return [];
      }
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    try {
      const parsed = extractJSON(response);
      return parsed.successPatterns || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Success pattern analysis error:', error);
    return [];
  }
}

// NEW: Community Intelligence Analysis Function
export async function analyzeCommunityIntelligence(
  chunkText: string,
  documentContext?: string,
  communityContext?: string
): Promise<CommunityIntelligenceResult> {
  if (!openai && !anthropic && !moonshotClient) {
    throw new Error('AI service not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or MOONSHOT_API_KEY environment variable.');
  }

  const systemPrompt = `You are a community intelligence analyst specializing in Aboriginal community development and the Barkly Regional Deal. 
Your role is to extract comprehensive community intelligence from documents, identifying needs, gaps, opportunities, success patterns, and risks.
Focus on the five community priorities: youth safety, learning, employment pathways, cultural strengthening, and service delivery.
Always maintain cultural sensitivity and respect for Aboriginal knowledge systems.
Respond in JSON format only.`;

  const userPrompt = `Analyze this document chunk for comprehensive community intelligence:
${documentContext ? `Document Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community Context: ${communityContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "summary": "2-3 sentence summary",
  "themes": [
    {
      "name": "theme name",
      "confidence": 0.0-1.0,
      "evidence": "supporting text"
    }
  ],
  "quotes": [
    {
      "text": "significant quote",
      "context": "surrounding context", 
      "significance": "why this matters",
      "confidence": 0.0-1.0
    }
  ],
  "keywords": [
    {
      "term": "keyword",
      "frequency": 1,
      "category": "community|technical|emotional|general"
    }
  ],
  "insights": [
    {
      "text": "actionable insight",
      "category": "opportunity|challenge|recommendation",
      "importance": 1-10
    }
  ],
  "communityNeeds": [
    {
      "need": "specific community need",
      "urgency": "low|medium|high|critical",
      "community": "community name or 'regional'",
      "evidence": ["supporting evidence from text"],
      "confidence": 0.0-1.0,
      "category": "housing|youth_development|health|employment|culture|justice|environment|education"
    }
  ],
  "serviceGaps": [
    {
      "service": "missing or inadequate service",
      "location": "where the gap exists",
      "impact": 1-10,
      "recommendations": ["suggested solutions"],
      "urgency": "low|medium|high|critical",
      "evidence": ["supporting evidence"]
    }
  ],
  "successPatterns": [
    {
      "pattern": "what's working well",
      "communities": ["communities where this works"],
      "replicability": 0.0-1.0,
      "requirements": ["what's needed to replicate"],
      "evidence": ["supporting evidence"],
      "outcomes": ["positive results achieved"]
    }
  ],
  "riskFactors": [
    {
      "risk": "potential issue or concern",
      "probability": 0.0-1.0,
      "impact": 1-10,
      "mitigation": ["suggested mitigation strategies"],
      "evidence": ["supporting evidence"],
      "communities": ["affected communities"]
    }
  ],
  "opportunities": [
    {
      "opportunity": "potential for positive change",
      "potential": 1-10,
      "requirements": ["what's needed to realize"],
      "timeline": "timeframe estimate",
      "evidence": ["supporting evidence"],
      "communities": ["communities that could benefit"]
    }
  ],
  "assets": [
    {
      "asset": "community strength or resource",
      "type": "human|physical|cultural|social|economic",
      "strength": 1-10,
      "communities": ["communities with this asset"],
      "evidence": ["supporting evidence"],
      "potential": ["how this could be leveraged"]
    }
  ]
}

Focus on identifying 2-3 items per intelligence category where evidence exists in the text.`;

  try {
    const provider = getAIProvider();
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature || 0.3,
        max_tokens: 2500, // Increased for comprehensive analysis
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Moonshot API');
      }

      try {
        return extractJSON(response) as CommunityIntelligenceResult;
      } catch (parseError) {
        console.error('Failed to parse Moonshot response:', response);
        throw new Error(`Invalid JSON response from Moonshot: ${parseError}`);
      }
    }
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 2500, // Increased for comprehensive analysis
        temperature: modelConfig.temperature || 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      try {
        return extractJSON(content.text) as CommunityIntelligenceResult;
      } catch (parseError) {
        console.error('Failed to parse Anthropic response:', content.text);
        throw new Error(`Invalid JSON response from Anthropic: ${parseError}`);
      }
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: modelConfig.temperature || 0.3,
      max_tokens: 2500, // Increased for comprehensive analysis
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    try {
      return extractJSON(response) as CommunityIntelligenceResult;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`);
    }
  } catch (error) {
    console.error('Community intelligence analysis error:', error);
    // Fallback to basic analysis if AI fails
    const basicAnalysis = await analyzeDocumentChunk(chunkText, documentContext);
    return {
      ...basicAnalysis,
      communityNeeds: [],
      serviceGaps: [],
      successPatterns: [],
      riskFactors: [],
      opportunities: [],
      assets: []
    };
  }
}