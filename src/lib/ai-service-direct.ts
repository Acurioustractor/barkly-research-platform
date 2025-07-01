/**
 * Direct AI service helper for internal use
 * Provides a simple interface to call AI models without HTTP overhead
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from './ai-config';

// Initialize clients
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 120000,
      maxRetries: 2,
    })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 120000,
      maxRetries: 2,
    })
  : null;

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

/**
 * Call AI service directly without HTTP overhead
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: AIOptions = {}
): Promise<any> {
  const { maxTokens = 2000, temperature = 0.3, responseFormat = 'text' } = options;
  
  const modelConfig = aiConfig.getModelConfig();
  const provider = modelConfig.provider === 'anthropic' && anthropic ? 'anthropic' : 
                  modelConfig.provider === 'openai' && openai ? 'openai' : 
                  anthropic ? 'anthropic' : openai ? 'openai' : null;

  if (!provider) {
    throw new Error('AI service not configured');
  }

  try {
    if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return responseFormat === 'json' ? JSON.parse(content.text) : content.text;
    } else {
      const completion = await openai!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === 'json' && { response_format: { type: 'json_object' } })
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return responseFormat === 'json' ? JSON.parse(response) : response;
    }
  } catch (error) {
    console.error('AI call error:', error);
    throw error;
  }
}

/**
 * Extract JSON from potentially malformed AI response
 */
export function extractJSON(text: string): any {
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