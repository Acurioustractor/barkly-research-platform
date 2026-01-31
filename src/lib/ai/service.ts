import { aiConfig } from './config';
import { AIProvider } from './providers/base';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { MoonshotProvider } from './providers/moonshot';
import {
  AIAnalysisResult,
  CommunityIntelligenceResult,
  ChunkAnalysisResult
} from './types';
import * as Prompts from './prompts';

// Cache providers to reuse clients
const providers: Record<string, AIProvider> = {};

function getProvider(): AIProvider {
  const modelConfig = aiConfig.getModelConfig();
  const providerType = modelConfig.provider;
  const modelName = modelConfig.model;

  const key = `${providerType}:${modelName}`;

  if (providers[key]) {
    return providers[key];
  }

  let provider: AIProvider;

  if (providerType === 'moonshot' && process.env.MOONSHOT_API_KEY) {
    provider = new MoonshotProvider(process.env.MOONSHOT_API_KEY, modelName);
  } else if (providerType === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, modelName);
  } else if (providerType === 'openai' && process.env.OPENAI_API_KEY) {
    provider = new OpenAIProvider(process.env.OPENAI_API_KEY, modelName);
  } else {
    // Fallbacks based on available keys if configured provider is missing key
    if (process.env.MOONSHOT_API_KEY) {
      provider = new MoonshotProvider(process.env.MOONSHOT_API_KEY, 'moonshot-v1-8k');
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
    } else if (process.env.OPENAI_API_KEY) {
      provider = new OpenAIProvider(process.env.OPENAI_API_KEY);
    } else {
      throw new Error('No AI provider configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or MOONSHOT_API_KEY.');
    }
  }

  providers[key] = provider;
  return provider;
}

import { aiCache } from './cache';

// ... imports

export async function analyzeDocumentChunk(
  chunkText: string,
  documentContext?: string
): Promise<AIAnalysisResult> {
  const cacheKey = aiCache.generateKey('analyzeDocumentChunk', chunkText, documentContext);
  const cached = aiCache.get<AIAnalysisResult>(cacheKey);

  if (cached) {
    return cached;
  }

  const provider = getProvider();

  try {
    const result = await provider.generateJSON<AIAnalysisResult>(
      Prompts.ANALYSIS_SYSTEM_PROMPT,
      Prompts.ANALYSIS_USER_PROMPT(chunkText, documentContext)
    );

    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {

    console.error('AI analysis error:', error);
    // Fallback
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
  const provider = getProvider();
  const combinedText = chunks.join('\n\n');
  const truncatedText = combinedText.substring(0, 8000); // Limit context

  try {
    return await provider.generateText(
      Prompts.SUMMARY_SYSTEM_PROMPT,
      Prompts.SUMMARY_USER_PROMPT(truncatedText, documentTitle)
    );
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Unable to generate summary at this time.';
  }
}

export async function extractThemesWithAI(
  text: string,
  predefinedThemes?: string[]
): Promise<Array<{ name: string; confidence: number; evidence: string }>> {
  const provider = getProvider();

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

  try {
    const result = await provider.generateJSON<any>(
      Prompts.THEME_System_PROMPT,
      Prompts.THEME_USER_PROMPT(text, themes)
    );

    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.themes)) return result.themes;
    return [];

  } catch (error) {
    console.error('Theme extraction error:', error);
    return [];
  }
}

export async function generateInsights(
  text: string,
  themes: string[]
): Promise<Array<{ text: string; category: string; importance: number }>> {
  const provider = getProvider();

  try {
    const result = await provider.generateJSON<any>(
      Prompts.INSIGHTS_SYSTEM_PROMPT,
      Prompts.INSIGHTS_USER_PROMPT(text, themes)
    );

    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.insights)) return result.insights;
    return [];
  } catch (error) {
    console.error('Insight generation error:', error);
    return [];
  }
}

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
  const provider = getProvider();

  try {
    const result = await provider.generateJSON<any>(
      Prompts.SUCCESS_PATTERNS_SYSTEM_PROMPT,
      Prompts.SUCCESS_PATTERNS_USER_PROMPT(chunkText, documentContext, communityContext)
    );

    return result.successPatterns || [];
  } catch (error) {
    console.error('Success pattern analysis error:', error);
    return [];
  }
}

// Legacy support for generic document analysis
export async function analyzeDocument(
  promptOrText: string,
  context?: string
): Promise<AIAnalysisResult> {
  const provider = getProvider();

  try {
    return await provider.generateJSON<AIAnalysisResult>(
      "You are an expert analyst. Respond in JSON.",
      context ? `Context: ${context}\n\n${promptOrText}` : promptOrText
    );
  } catch (error) {
    console.error('Generic analysis error:', error);
    return {
      summary: '',
      themes: [],
      quotes: [],
      keywords: [],
      insights: []
    };
  }
}


export async function analyzeCommunityIntelligence(
  chunkText: string,
  documentContext?: string,
  communityContext?: string
): Promise<CommunityIntelligenceResult> {
  const provider = getProvider();

  try {
    return await provider.generateJSON<CommunityIntelligenceResult>(
      Prompts.COMMUNITY_INTELLIGENCE_SYSTEM_PROMPT,
      Prompts.COMMUNITY_INTELLIGENCE_USER_PROMPT(chunkText, documentContext, communityContext)
    );
  } catch (error) {
    console.error('Community intelligence analysis error:', error);
    const basic = await analyzeDocumentChunk(chunkText, documentContext);
    return {
      ...basic,
      communityNeeds: [],
      serviceGaps: [],
      successPatterns: [],
      riskFactors: [],
      opportunities: [],
      assets: []
    };
  }
}

// Chunking Logic
export async function intelligentChunkText(
  text: string,
  maxChunkSize: number = 2000,
  overlapSize: number = 200
): Promise<Array<ChunkAnalysisResult>> {
  // Currently just uses basic chunking, but structure allows for AI chunking later
  return basicChunkText(text, maxChunkSize, overlapSize);
}

function basicChunkText(
  text: string,
  maxChunkSize: number,
  overlapSize: number
): Array<ChunkAnalysisResult> {
  const chunks: Array<ChunkAnalysisResult> = [];
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

// Orchestrator
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
    const chunks = await intelligentChunkText(documentContent);

    const chunkAnalyses: AIAnalysisResult[] = [];
    const intelligenceAnalyses: CommunityIntelligenceResult[] = [];

    // Map chunks to promises
    // TODO: concurrency limit if needed, but for now parallel
    const promises = chunks.map(async chunk => {
      const [basic, intelligence, patterns] = await Promise.all([
        analyzeDocumentChunk(chunk.text, documentTitle),
        analyzeCommunityIntelligence(chunk.text, documentTitle, communityContext),
        analyzeSuccessPatterns(chunk.text, documentTitle, communityContext)
      ]);

      intelligence.successPatterns = patterns;
      return { basic, intelligence };
    });

    const results = await Promise.all(promises);

    for (const res of results) {
      chunkAnalyses.push(res.basic);
      intelligenceAnalyses.push(res.intelligence);
    }

    const combinedBasicAnalysis = combineChunkAnalyses(chunkAnalyses);
    const combinedIntelligence = combineIntelligenceAnalyses(intelligenceAnalyses);

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
    const fallback = await analyzeDocumentChunk(documentContent.substring(0, 2000), documentTitle);
    return {
      basicAnalysis: fallback,
      communityIntelligence: {
        ...fallback,
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

// Helpers for combining results (Copied from original)
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

  if (analyses.length === 1) return analyses[0];

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

  const allQuotes = analyses.flatMap(a => a.quotes);
  const topQuotes = allQuotes
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

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

  const allInsights = analyses.flatMap(a => a.insights);
  const topInsights = allInsights
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15);

  return {
    summary: analyses[0].summary,
    themes: combinedThemes,
    quotes: topQuotes,
    keywords: combinedKeywords,
    insights: topInsights
  };
}

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
    } as CommunityIntelligenceResult;
  }

  if (analyses.length === 1) return analyses[0];

  const basicCombined = combineChunkAnalyses(analyses);

  const allCommunityNeeds = analyses.flatMap(a => a.communityNeeds);
  const allServiceGaps = analyses.flatMap(a => a.serviceGaps);
  const allSuccessPatterns = analyses.flatMap(a => a.successPatterns);
  const allRiskFactors = analyses.flatMap(a => a.riskFactors);
  const allOpportunities = analyses.flatMap(a => a.opportunities);
  const allAssets = analyses.flatMap(a => a.assets);

  function deduplicateByField<T extends Record<string, any>>(items: T[], field: string): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item[field];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

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
