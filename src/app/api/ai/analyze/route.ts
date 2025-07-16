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
    const requestBody = await request.json();

    // Support both old and new request formats
    if (requestBody.systemPrompt && requestBody.userPrompt) {
      // Old format - direct prompts
      return handleDirectPrompts(requestBody);
    } else if (requestBody.content) {
      // New format - content analysis
      return handleContentAnalysis(requestBody);
    } else {
      return NextResponse.json(
        { error: 'Missing required fields: either (systemPrompt, userPrompt) or (content)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'AI analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleDirectPrompts(requestBody: any) {
  const { systemPrompt, userPrompt, maxTokens = 2000, temperature = 0.3 } = requestBody;

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
}

async function handleContentAnalysis(requestBody: any) {
  const { 
    content, 
    analysisType = 'standard', 
    options = {},
    temperature = 0.3 
  } = requestBody;

  // Get processing profile based on analysisType
  const profileMap: { [key: string]: string } = {
    'quick': 'quick-analysis',
    'standard': 'standard-analysis', 
    'deep': 'deep-analysis',
    'world-class': 'world-class-semantic'
  };

  const profileName = profileMap[analysisType] || 'standard-analysis';
  const profile = aiConfig.getProcessingProfile(profileName as any);
  const modelConfig = aiConfig.getModelConfig(profile.aiModel as any);

  const provider = modelConfig.provider === 'anthropic' && anthropic ? 'anthropic' : 
                  modelConfig.provider === 'openai' && openai ? 'openai' : 
                  anthropic ? 'anthropic' : openai ? 'openai' : null;

  if (!provider) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 }
    );
  }

  // Build system prompt based on options
  const systemPrompt = buildAnalysisSystemPrompt(options, profile);
  const userPrompt = `Analyze the following content:\n\n${content}`;

  let result;

  if (provider === 'anthropic') {
    const completion = await anthropic!.messages.create({
      model: modelConfig.model,
      max_tokens: 4000,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const responseContent = completion.content[0];
    if (!responseContent || responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    result = JSON.parse(responseContent.text);
  } else {
    const completion = await openai!.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    result = JSON.parse(response);
  }

  return NextResponse.json(result);
}

function buildAnalysisSystemPrompt(options: any, profile: any): string {
  const extractThemes = options.extractThemes !== false;
  const extractQuotes = options.extractQuotes !== false;
  const extractInsights = options.extractInsights !== false;
  const extractEntities = options.extractEntities || profile.extractEntities;
  const extractSystems = options.extractSystems || false;

  let prompt = `You are an expert research analyst specializing in Indigenous youth research and community services. 
Analyze the provided content and return your findings in valid JSON format.

Your analysis should focus on:
- Community strengths and resources
- Youth development opportunities  
- Cultural connections and identity
- Service delivery effectiveness
- Barriers and challenges
- Future recommendations

Return a JSON object with the following structure:`;

  let jsonSchema: any = {};

  if (extractThemes) {
    jsonSchema.themes = `Array of themes (max ${profile.maxThemes || 10}), each with: { title: string, description: string, category: string, confidence: number, mentions: number }`;
  }

  if (extractQuotes) {
    jsonSchema.quotes = `Array of significant quotes (max ${profile.maxQuotes || 20}), each with: { text: string, context: string, confidence: number, significance: string }`;
  }

  if (extractInsights) {
    jsonSchema.insights = `Array of insights (max ${profile.maxInsights || 15}), each with: { title: string, description: string, type: string, confidence: number, actionable: boolean }`;
  }

  if (extractEntities) {
    jsonSchema.entities = `Array of entities: { name: string, type: string, description: string, relevance: number }`;
  }

  if (extractSystems) {
    jsonSchema.systems = `Array of system elements: { name: string, type: string, description: string, connections: string[] }`;
  }

  prompt += `\n${JSON.stringify(jsonSchema, null, 2)}`;

  prompt += `\n\nEnsure all analysis respects Indigenous research protocols and CARE+ principles (Collective benefit, Authority to control, Responsibility, Ethics).`;

  return prompt;
}