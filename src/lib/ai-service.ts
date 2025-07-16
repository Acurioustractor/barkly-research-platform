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