import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from '@/lib/ai-config';

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

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, maxTokens = 2000, temperature = 0.3 } = await request.json();

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required prompts' },
        { status: 400 }
      );
    }

    const modelConfig = aiConfig.getModelConfig();
    const provider = modelConfig.provider === 'anthropic' && anthropic ? 'anthropic' : 
                    modelConfig.provider === 'openai' && openai ? 'openai' : 
                    anthropic ? 'anthropic' : openai ? 'openai' : null;

    if (!provider) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    let result;

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

      result = JSON.parse(content.text);
    } else {
      const completion = await openai!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      result = JSON.parse(response);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'AI analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}