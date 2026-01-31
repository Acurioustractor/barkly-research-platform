import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentProcessor } from '@/utils/enhanced-document-processor';
import { prisma } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    const includeChunks = searchParams.get('includeChunks') === 'true';
    const chunkLimit = parseInt(searchParams.get('chunkLimit') || '10');
    const chunkOffset = parseInt(searchParams.get('chunkOffset') || '0');

    const processor = new EnhancedDocumentProcessor();
    const document = await processor.getDocument(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const result = {
      id: document.id,
      filename: document.originalName,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt,
      status: document.status,
      errorMessage: document.errorMessage,
      source: document.source,
      category: document.category,
      tags: document.tags ? JSON.parse(document.tags as string) : [],
      pageCount: document.pageCount,
      wordCount: document.wordCount,
      summary: document.summary,
      fullText: document.fullText,
      themes: document.themes.map(t => ({
        id: t.id,
        theme: t.theme,
        confidence: t.confidence,
        context: t.context
      })),
      quotes: document.quotes.map(q => ({
        id: q.id,
        text: q.text,
        context: q.context,
        speaker: q.speaker,
        page: q.page,
        confidence: q.confidence,
        category: q.category
      })),
      insights: document.insights.map(i => ({
        id: i.id,
        insight: i.insight,
        type: i.type,
        confidence: i.confidence,
        evidence: i.evidence ? JSON.parse(i.evidence as string) : null
      })),
      keywords: document.keywords.map(k => ({
        id: k.id,
        keyword: k.keyword,
        frequency: k.frequency,
        relevance: k.relevance,
        category: k.category
      })),
      chunks: includeChunks ? document.chunks.slice(chunkOffset, chunkOffset + chunkLimit).map(c => ({
        id: c.id,
        index: c.chunkIndex,
        text: c.text,
        wordCount: c.wordCount,
        startChar: c.startChar,
        endChar: c.endChar,
        startPage: c.startPage,
        endPage: c.endPage,
        topics: c.topics ? JSON.parse(c.topics as string) : null
      })) : [],
      chunkCount: document.chunks.length
    };

    return NextResponse.json({
      success: true,
      document: result
    });

  } catch (error) {
    console.error('Get document error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    // Check if document exists without vector columns
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, originalName: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete the document (cascading delete will handle related records)
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    
    const { category, source, tags, status, originalName } = body;
    
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(source && { source }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(status && { status }),
        ...(originalName && { originalName })
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        filename: updatedDocument.originalName,
        category: updatedDocument.category,
        source: updatedDocument.source,
        tags: updatedDocument.tags ? JSON.parse(updatedDocument.tags as string) : [],
        status: updatedDocument.status
      }
    });

  } catch (error) {
    console.error('Update document error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}