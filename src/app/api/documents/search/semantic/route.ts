import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingsService } from '@/lib/embeddings-service';
import { isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 30; // 30 seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if embeddings are configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Semantic search not configured. OpenAI API key required.' },
        { status: 501 }
      );
    }

    const body = await request.json();
    const { query, limit = 10, threshold = 0.7 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate parameters
    const searchLimit = Math.min(Math.max(1, parseInt(limit)), 50); // Cap at 50 results
    const searchThreshold = Math.min(Math.max(0, parseFloat(threshold)), 1); // Between 0 and 1

    // Perform semantic search
    const embeddingsService = new EmbeddingsService();
    const results = await embeddingsService.semanticSearch(
      query,
      searchLimit,
      searchThreshold
    );

    // Format results with additional document info
    const formattedResults = await Promise.all(
      results.map(async (result) => {
        // Get document info for each result
        const { prisma } = await import('@/lib/database-safe');
        if (!prisma) return result;

        const document = await prisma.document.findUnique({
          where: { id: result.documentId },
          select: {
            id: true,
            originalName: true,
            category: true,
            uploadedAt: true,
            source: true
          }
        });

        return {
          ...result,
          document
        };
      })
    );

    return NextResponse.json({
      success: true,
      query,
      resultCount: formattedResults.length,
      results: formattedResults
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform semantic search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Semantic search endpoint',
    method: 'POST',
    parameters: {
      query: 'Search query (required)',
      limit: 'Maximum number of results (default: 10, max: 50)',
      threshold: 'Similarity threshold (default: 0.7, range: 0-1)'
    },
    requirements: [
      'OpenAI API key configured',
      'Documents must have embeddings generated',
      'PostgreSQL with pgvector extension'
    ]
  });
}