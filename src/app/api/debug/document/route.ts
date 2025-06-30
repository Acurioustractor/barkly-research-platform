import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      // Get recent failed documents
      const failedDocs = await prisma?.document.findMany({
        where: { status: 'FAILED' },
        take: 10,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          errorMessage: true,
          uploadedAt: true,
          size: true
        }
      });
      
      return NextResponse.json({
        message: 'Recent failed documents',
        documents: failedDocs || []
      });
    }
    
    // Get specific document
    const document = await prisma?.document.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            chunks: true,
            themes: true,
            quotes: true,
            insights: true,
            keywords: true
          }
        }
      }
    });
    
    if (!document) {
      return NextResponse.json({
        error: 'Document not found',
        id
      }, { status: 404 });
    }
    
    return NextResponse.json({
      document,
      debug: {
        hasFullText: Boolean(document.fullText),
        fullTextLength: document.fullText?.length || 0,
        errorMessage: document.errorMessage,
        status: document.status
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}