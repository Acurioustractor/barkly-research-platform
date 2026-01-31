import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/ai/processing/document-processor';
import { DatabaseSaver } from '@/lib/ai/processing/database-saver';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

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

    console.log(`Starting AI processing for document: ${documentId}`);

    // Process the document
    const results = await DocumentProcessor.processDocument(documentId);

    // Save results to database
    await DatabaseSaver.saveProcessingResults(documentId, results);

    // Get final stats
    const stats = await DatabaseSaver.getProcessingStats(documentId);

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully',
      documentId,
      results: {
        themes: results.themes.length,
        quotes: results.quotes.length,
        insights: results.insights.length,
        entities: results.entities.length
      },
      stats
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json({
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get processing status for a document
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    const isProcessed = await DatabaseSaver.isDocumentProcessed(documentId);
    const stats = await DatabaseSaver.getProcessingStats(documentId);

    return NextResponse.json({
      success: true,
      documentId,
      isProcessed,
      stats
    });

  } catch (error) {
    console.error('Error checking processing status:', error);
    return NextResponse.json({
      error: 'Failed to check processing status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}