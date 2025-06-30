import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from './ai-config';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

// Determine which AI provider to use
function getAIProvider() {
  const modelConfig = aiConfig.getModelConfig();
  if (modelConfig.provider === 'anthropic' && anthropic) {
    return 'anthropic';
  }
  if (modelConfig.provider === 'openai' && openai) {
    return 'openai';
  }
  // Fallback to any available provider
  if (anthropic) return 'anthropic';
  if (openai) return 'openai';
  return null;
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
  if (!openai && !useAnthropic) {
    throw new Error('AI service not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }

  const systemPrompt = `You are an expert document analyst specializing in extracting meaningful insights from documents.
Your task is to analyze the provided text chunk and extract:
1. A concise summary (2-3 sentences)
2. Key themes with confidence scores
3. Significant quotes with context
4. Important keywords categorized by type
5. Strategic insights

Focus on themes related to: Youth Voice and Leadership, Cultural Identity and Heritage, Education and Learning, Health and Well-being, Technology and Innovation, Environmental Sustainability, Social Justice and Equity, Community Development.

Respond in JSON format only.`;

  const userPrompt = `Analyze this document chunk:
${documentContext ? `Document Context: ${documentContext}\n\n` : ''}
Text: ${chunkText}

Provide analysis in this exact JSON format:
{
  "summary": "concise 2-3 sentence summary",
  "themes": [
    {
      "name": "theme name",
      "confidence": 0.0-1.0,
      "evidence": "supporting text from chunk"
    }
  ],
  "quotes": [
    {
      "text": "exact quote",
      "context": "surrounding context",
      "significance": "why this quote matters",
      "confidence": 0.0-1.0
    }
  ],
  "keywords": [
    {
      "term": "keyword",
      "frequency": count,
      "category": "community|technical|emotional|general"
    }
  ],
  "insights": [
    {
      "text": "insight description",
      "category": "theme category",
      "importance": 1-10
    }
  ]
}`;

  try {
    const provider = getAIProvider();
    const modelConfig = aiConfig.getModelConfig();
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || 4096,
        temperature: modelConfig.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      
      return JSON.parse(content.text) as AIAnalysisResult;
    }

    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(response) as AIAnalysisResult;
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
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 1000,
        temperature: modelConfig.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (content.type !== 'text') {
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
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || 2000,
        temperature: 0.2,
        system: 'You are an expert at identifying themes in documents. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }]
      });

      const content = completion.content[0];
      if (content.type !== 'text') {
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
    
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || 2000,
        temperature: 0.4,
        system: 'You are a strategic analyst generating actionable insights from documents. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt + '\n\nRemember to respond with valid JSON array format.' }]
      });

      const content = completion.content[0];
      if (content.type !== 'text') {
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
  if (!openai && !useAnthropic) {
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