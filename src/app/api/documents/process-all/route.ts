import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/ai/processing/document-processor';
import { DatabaseSaver } from '@/lib/ai/processing/database-saver';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const forceReprocess = searchParams.get('force') === 'true';

    console.log(`Starting batch processing of up to ${limit} documents`);

    // Get unprocessed documents
    const unprocessedDocs = await DatabaseSaver.getUnprocessedDocuments();

    if (unprocessedDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed documents found',
        processed: 0,
        total: 0
      });
    }

    const docsToProcess = unprocessedDocs.slice(0, limit);
    const results = [];

    console.log(`Found ${unprocessedDocs.length} unprocessed documents, processing ${docsToProcess.length}`);

    // Process each document
    for (const doc of docsToProcess) {
      try {
        console.log(`Processing document: ${doc.title} (${doc.id})`);

        // Check if already processed (unless force reprocess)
        if (!forceReprocess) {
          const isProcessed = await DatabaseSaver.isDocumentProcessed(doc.id);
          if (isProcessed) {
            console.log(`Skipping already processed document: ${doc.id}`);
            continue;
          }
        }

        // Mark as processing
        await DatabaseSaver.markDocumentProcessing(doc.id);

        // Process the document
        const processingResults = await DocumentProcessor.processDocument(doc.id);

        // Save results to database
        await DatabaseSaver.saveProcessingResults(doc.id, processingResults);

        // Get final stats
        const stats = await DatabaseSaver.getProcessingStats(doc.id);

        results.push({
          documentId: doc.id,
          title: doc.title,
          success: true,
          stats
        });

        console.log(`Successfully processed: ${doc.title}`);

        // Add delay between documents to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);

        results.push({
          documentId: doc.id,
          title: doc.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter((r: any) => r.success).length;
    const failureCount = results.filter((r: any) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Batch processing complete. ${successCount} succeeded, ${failureCount} failed.`,
      processed: successCount,
      failed: failureCount,
      total: docsToProcess.length,
      results
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json({
      error: 'Failed to process documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get processing queue status
export async function GET(request: NextRequest) {
  try {
    const unprocessedDocs = await DatabaseSaver.getUnprocessedDocuments();

    return NextResponse.json({
      success: true,
      queue: {
        unprocessed: unprocessedDocs.length,
        documents: unprocessedDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          fileType: doc.file_type,
          uploadedAt: doc.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error getting processing queue:', error);
    return NextResponse.json({
      error: 'Failed to get processing queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}