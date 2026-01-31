import { NextRequest, NextResponse } from 'next/server';
import { SimpleProcessor } from '@/lib/ai/processing/simple-processor';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    console.log(`Starting simple processing for document: ${documentId}`);

    // Process with simple rule-based analysis
    const results = await SimpleProcessor.processDocumentSimple(documentId);

    // Save results
    await SimpleProcessor.saveSimpleResults(documentId, results);

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully with simple analysis',
      documentId,
      results: {
        themes: results.themes.length,
        quotes: results.quotes.length,
        insights: results.insights.length
      },
      sample: {
        themes: results.themes.slice(0, 3),
        quotes: results.quotes.slice(0, 2),
        insights: results.insights.slice(0, 2)
      }
    });

  } catch (error) {
    console.error('Simple processing error:', error);
    return NextResponse.json({
      error: 'Failed to process document with simple analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}