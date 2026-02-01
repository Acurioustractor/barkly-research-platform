import { NextRequest, NextResponse } from 'next/server';
import { aiConfig, AI_MODELS, EMBEDDING_MODELS, PROCESSING_PROFILES } from '@/lib/ai/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeModels = searchParams.get('includeModels') !== 'false';
    const includeProfiles = searchParams.get('includeProfiles') !== 'false';
    const documentWords = searchParams.get('documentWords');

    // Validate configuration
    const validation = aiConfig.validateConfig();

    // Base response
    const response: any = {
      valid: validation.valid,
      errors: validation.errors,
      currentConfig: {
        defaultModel: aiConfig.getModelConfig(),
        defaultEmbeddingModel: aiConfig.getEmbeddingConfig(),
        defaultProfile: aiConfig.getProcessingProfile()
      }
    };

    // Include available models if requested
    if (includeModels) {
      response.models = {
        ai: Object.entries(AI_MODELS).map(([key, config]: [string, any]) => ({
          id: key,
          name: config.name,
          provider: config.provider,
          description: config.description
        })),
        embedding: Object.entries(EMBEDDING_MODELS).map(([key, config]: [string, any]) => ({
          id: key,
          name: config.name,
          provider: config.provider,
          description: config.description
        }))
      };
    }

    if (includeProfiles) {
      response.processingProfiles = Object.entries(PROCESSING_PROFILES).map(([key, config]: [string, any]) => ({
        id: key,
        name: config.name,
        description: config.description,
        features: config.features
      }));
    }

    // Calculate cost estimate if document size provided
    if (documentWords) {
      const words = parseInt(documentWords);
      if (!isNaN(words) && words > 0) {
        response.costEstimates = {};

        // Calculate for each profile
        for (const [profileName] of Object.entries(PROCESSING_PROFILES)) {
          response.costEstimates[profileName] = aiConfig.estimateProcessingCost(
            words,
            profileName as keyof typeof PROCESSING_PROFILES
          );
        }
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI config error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get AI configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'estimateCost': {
        const { documentWords, profile } = data;

        if (!documentWords || typeof documentWords !== 'number') {
          return NextResponse.json(
            { error: 'documentWords must be a number' },
            { status: 400 }
          );
        }

        const estimate = aiConfig.estimateProcessingCost(
          documentWords,
          profile || 'standard-analysis'
        );

        return NextResponse.json({
          success: true,
          estimate,
          profile: profile || 'standard-analysis',
          documentWords
        });
      }

      case 'validateModel': {
        const { modelName } = data;

        if (!modelName || !(modelName in AI_MODELS)) {
          return NextResponse.json(
            { error: 'Invalid model name' },
            { status: 400 }
          );
        }

        const modelConfig = AI_MODELS[modelName as keyof typeof AI_MODELS];
        const hasApiKey =
          (modelConfig.provider === 'openai' && !!process.env.OPENAI_API_KEY) ||
          (modelConfig.provider === 'anthropic' && !!process.env.ANTHROPIC_API_KEY);

        return NextResponse.json({
          success: true,
          model: modelName,
          available: hasApiKey,
          config: modelConfig
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI config action error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process AI configuration action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}