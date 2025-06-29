import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentProcessor } from '@/utils/enhanced-document-processor';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const contentType = searchParams.get('contentType') || undefined;

    const processor = new EnhancedDocumentProcessor();
    const chunks = await processor.getDocumentChunks(id, {
      limit,
      offset,
      contentType
    });

    if (chunks.length === 0 && offset === 0) {
      // Check if document exists
      const document = await processor.getDocument(id);
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
    }

    const results = chunks.map(chunk => ({
      id: chunk.id,
      index: chunk.chunkIndex,
      text: chunk.text,
      wordCount: chunk.wordCount,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
      startPage: chunk.startPage,
      endPage: chunk.endPage,
      topics: chunk.topics ? JSON.parse(chunk.topics as string) : null
    }));

    return NextResponse.json({
      success: true,
      documentId: id,
      chunks: results,
      pagination: {
        limit,
        offset,
        count: results.length,
        hasMore: results.length === limit
      }
    });

  } catch (error) {
    console.error('Get document chunks error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document chunks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}