import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    console.log(`[ADMIN] Fixing stuck document: ${documentId}`);

    // Find documents that have been processing for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const stuckDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        status: 'PROCESSING',
        uploadedAt: {
          lt: fiveMinutesAgo
        }
      }
    });

    if (!stuckDocument) {
      return NextResponse.json({ 
        error: 'Document not found or not stuck (must be PROCESSING for >5 minutes)' 
      }, { status: 404 });
    }

    // Update the stuck document to FAILED status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: 'Document processing timed out (manually resolved)',
        processedAt: new Date(),
      }
    });

    console.log(`[ADMIN] Fixed stuck document: ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'Stuck document fixed',
      document: {
        id: updatedDocument.id,
        originalName: updatedDocument.originalName,
        status: updatedDocument.status,
        errorMessage: updatedDocument.errorMessage,
        processedAt: updatedDocument.processedAt
      }
    });

  } catch (error) {
    console.error('[ADMIN] Fix stuck document error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix stuck document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to find all stuck documents
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Find documents that have been processing for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const stuckDocuments = await prisma.document.findMany({
      where: {
        status: 'PROCESSING',
        uploadedAt: {
          lt: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        originalName: true,
        status: true,
        uploadedAt: true,
        size: true
      }
    });

    return NextResponse.json({
      stuckDocuments,
      count: stuckDocuments.length,
      message: stuckDocuments.length > 0 ? 'Found stuck documents' : 'No stuck documents found'
    });

  } catch (error) {
    console.error('[ADMIN] Get stuck documents error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get stuck documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}