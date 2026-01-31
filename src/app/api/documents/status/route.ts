import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get all documents with their processing status
    const documents = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, title, file_type, file_size, created_at,
        processing_status, processed_at, ai_analysis,
        (SELECT COUNT(*) FROM document_themes dt WHERE dt.document_id = d.id) as themes_count,
        (SELECT COUNT(*) FROM document_quotes dq WHERE dq.document_id = d.id) as quotes_count,
        (SELECT COUNT(*) FROM document_insights di WHERE di.document_id = d.id) as insights_count
      FROM documents d
      ORDER BY d.created_at DESC
    `;

    const summary = {
      total: documents.length,
      byStatus: documents.reduce((acc: any, doc) => {
        const status = doc.processing_status || 'unset';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      totalProcessingResults: {
        themes: documents.reduce((sum: number, doc: any) => sum + parseInt(doc.themes_count || '0'), 0),
        quotes: documents.reduce((sum: number, doc: any) => sum + parseInt(doc.quotes_count || '0'), 0),
        insights: documents.reduce((sum: number, doc: any) => sum + parseInt(doc.insights_count || '0'), 0)
      }
    };

    return NextResponse.json({
      success: true,
      summary,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        createdAt: doc.created_at,
        processingStatus: doc.processing_status || 'unset',
        processingResults: {
          themes: parseInt(doc.themes_count || '0'),
          quotes: parseInt(doc.quotes_count || '0'),
          insights: parseInt(doc.insights_count || '0')
        },
        processedAt: doc.processed_at,
        aiAnalysis: doc.ai_analysis
      }))
    });

  } catch (error) {
    console.error('Error getting document status:', error);
    return NextResponse.json({
      error: 'Failed to get document status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update processing status for documents
export async function POST(request: NextRequest) {
  try {
    const { documentIds, status } = await request.json();

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({
        error: 'documentIds array is required'
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({
        error: 'status is required'
      }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Update status for all specified documents
    for (const documentId of documentIds) {
      await prisma.$queryRaw`
        UPDATE documents 
        SET processing_status = ${status}
        WHERE id = ${documentId}::uuid
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${documentIds.length} documents to status: ${status}`,
      updatedDocuments: documentIds
    });

  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json({
      error: 'Failed to update document status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}