import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingsService } from '@/lib/ai/embeddings-service';
import { isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 30; // 30 seconds
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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
        { error: 'Similar documents search not configured. OpenAI API key required.' },
        { status: 501 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '5')), 20);

    // Check if document exists
    const { prisma } = await import('@/lib/database-safe');
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        originalName: true,
        status: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Document processing not completed' },
        { status: 400 }
      );
    }

    // Find similar documents
    const embeddingsService = new EmbeddingsService();
    const similarDocs = await embeddingsService.findSimilarDocuments(id, limit);

    // Get additional details for similar documents
    const detailedResults = await Promise.all(
      similarDocs.map(async (doc) => {
        const details = await prisma.document.findUnique({
          where: { id: doc.documentId },
          select: {
            id: true,
            originalName: true,
            category: true,
            source: true,
            uploadedAt: true,
            summary: true,
            themes: {
              select: {
                theme: true,
                confidence: true
              },
              orderBy: { confidence: 'desc' },
              take: 3
            }
          }
        });

        return {
          ...doc,
          details
        };
      })
    );

    return NextResponse.json({
      success: true,
      sourceDocument: {
        id: document.id,
        title: document.originalName
      },
      similarDocuments: detailedResults
    });

  } catch (error) {
    console.error('Find similar documents error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to find similar documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}