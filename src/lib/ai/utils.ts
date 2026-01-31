import { aiConfig } from './config';
import { moonshotClient } from './moonshot-client';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients (lazy load if possible, but for string check we need availability)
// Note: We're checking process.env directly here to avoid circular deps or complex init
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasMoonshot = !!process.env.MOONSHOT_API_KEY;

export function getAIProvider(config = aiConfig.getModelConfig()): 'openai' | 'anthropic' | 'moonshot' | null {
    if (config.provider === 'moonshot' && hasMoonshot) return 'moonshot';
    if (config.provider === 'anthropic' && hasAnthropic) return 'anthropic';
    if (config.provider === 'openai' && hasOpenAI) return 'openai';

    // Fallbacks
    if (hasMoonshot) return 'moonshot';
    if (hasAnthropic) return 'anthropic';
    if (hasOpenAI) return 'openai';

    return null;
}

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
            } catch { }
        }

        // Try to find JSON object in the text
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            try {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            } catch { }
        }

        // Fallback: return the text if it looks like a string, or throw
        // But callers expect object mostly. Return null or empty object?
        // Based on usage, throwing might be better or handled by caller.
        throw new Error('No valid JSON found in response');
    }
}
