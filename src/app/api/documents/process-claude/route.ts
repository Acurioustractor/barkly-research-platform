import { NextRequest, NextResponse } from 'next/server';
import { AnthropicProcessor } from '@/lib/ai-processing/anthropic-processor';
import { DatabaseSaver } from '@/lib/ai-processing/database-saver';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    console.log(`Starting Claude processing for document: ${documentId}`);

    // Check if already processed
    const isProcessed = await DatabaseSaver.isDocumentProcessed(documentId);
    if (isProcessed) {
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        documentId
      });
    }

    // Mark as processing
    await DatabaseSaver.markDocumentProcessing(documentId);

    // Process with Claude
    const results = await AnthropicProcessor.processDocument(documentId);

    // Save results
    await AnthropicProcessor.saveResults(documentId, results);

    // Get final stats
    const stats = await DatabaseSaver.getProcessingStats(documentId);

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully with Claude',
      documentId,
      results: {
        themes: results.themes.length,
        quotes: results.quotes.length,
        insights: results.insights.length
      },
      stats,
      sample: {
        themes: results.themes.slice(0, 3),
        quotes: results.quotes.slice(0, 2),
        insights: results.insights.slice(0, 2)
      }
    });

  } catch (error) {
    console.error('Claude processing error:', error);
    
    // Mark document as failed
    if (request.body) {
      try {
        const { documentId } = await request.json();
        await DatabaseSaver.markDocumentProcessing(documentId);
        // Actually mark as failed in the database
        if (global.prisma) {
          await global.prisma.$queryRaw`
            UPDATE documents 
            SET processing_status = 'failed'
            WHERE id = ${documentId}::uuid
          `;
        }
      } catch (markError) {
        console.error('Error marking document as failed:', markError);
      }
    }

    return NextResponse.json({
      error: 'Failed to process document with Claude',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}