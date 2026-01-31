import { NextRequest, NextResponse } from 'next/server';
import { aiConfig } from '@/lib/ai/config';
import { analyzeDocumentChunk, generateDocumentSummary } from '@/lib/ai-service';
import { EmbeddingsService } from '@/lib/ai/embeddings-service';

export const dynamic = 'force-dynamic';

// Test endpoint for AI functionality
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test, data } = body;

    switch (test) {
      case 'config': {
        // Test AI configuration
        const validation = aiConfig.validateConfig();
        const modelConfig = aiConfig.getModelConfig();
        const embeddingConfig = aiConfig.getEmbeddingConfig();
        
        return NextResponse.json({
          success: validation.valid,
          validation,
          currentConfig: {
            model: modelConfig,
            embedding: embeddingConfig
          },
          apiKeys: {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY
          }
        });
      }

      case 'analysis': {
        // Test document analysis
        const { text = 'This is a test document about youth leadership and community development.' } = data || {};
        
        try {
          const result = await analyzeDocumentChunk(text);
          return NextResponse.json({
            success: true,
            result
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
          });
        }
      }

      case 'summary': {
        // Test summary generation
        const { chunks = ['Test chunk 1 about education.', 'Test chunk 2 about health.'] } = data || {};
        
        try {
          const summary = await generateDocumentSummary(chunks, 'Test Document');
          return NextResponse.json({
            success: true,
            summary
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Summary generation failed'
          });
        }
      }

      case 'embedding': {
        // Test embedding generation
        const { text = 'Youth empowerment through education' } = data || {};
        
        try {
          const embeddingsService = new EmbeddingsService();
          const embedding = await embeddingsService.generateEmbedding(text);
          
          return NextResponse.json({
            success: true,
            text,
            embeddingLength: embedding.length,
            embeddingSample: embedding.slice(0, 10) // First 10 values
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Embedding generation failed'
          });
        }
      }

      case 'cost': {
        // Test cost estimation
        const { words = 10000, profile = 'standard-analysis' } = data || {};
        
        const estimate = aiConfig.estimateProcessingCost(words, profile);
        
        return NextResponse.json({
          success: true,
          words,
          profile,
          estimate
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Test Endpoint',
    availableTests: {
      config: 'Test AI configuration and API keys',
      analysis: 'Test document chunk analysis',
      summary: 'Test document summary generation',
      embedding: 'Test embedding generation',
      cost: 'Test cost estimation'
    },
    usage: 'POST /api/test/ai with { test: "config|analysis|summary|embedding|cost", data: {...} }'
  });
}