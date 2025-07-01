import { NextRequest, NextResponse } from 'next/server';
import { ParallelDocumentProcessor } from '@/utils/parallel-document-processor';
// Error handling imports removed - using direct error handling

export const maxDuration = 60; // 1 minute
export const dynamic = 'force-dynamic';

// ParallelUploadResponse interface removed - not used

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const processor = new ParallelDocumentProcessor({
    maxConcurrentChunks: 5,
    maxConcurrentDocuments: 2,
    enableBatching: true,
    batchSize: 3,
    aiRequestsPerMinute: 60,
    embeddingRequestsPerMinute: 300
  });

  try {
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Get processing options
    const options = {
      source: formData.get('source') as string,
      category: formData.get('category') as string,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
      generateEmbeddings: formData.get('generateEmbeddings') !== 'false',
      generateSummary: formData.get('generateSummary') !== 'false',
      analysisDepth: (formData.get('analysisDepth') as 'standard' | 'deep' | 'exhaustive') || 'standard',
      streamResults: formData.get('streamResults') === 'true'
    };

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }

    // Validate file types and sizes
    const validation = validateFiles(files);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        details: validation.details
      }, { status: 400 });
    }

    // Prepare documents
    const documents = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name
      }))
    );

    // Set up progress tracking
    const progressMap = new Map<string, number>();
    
    const processingOptions = {
      ...options,
      onProgress: (progress: any) => {
        progressMap.set(progress.documentId, progress.percentage);
        
        // Could send SSE events here for real-time progress
        console.log(`Progress: ${progress.documentId} - ${progress.stage} - ${progress.percentage}%`);
      }
    };

    let results;
    
    if (options.streamResults && documents.length > 3) {
      // Use streaming for large batches
      results = await processWithStreaming(processor, documents, processingOptions);
    } else {
      // Use batch processing
      results = await processor.processDocuments(documents, processingOptions);
    }

    // Get processing metrics
    const metrics = processor.getProcessingMetrics();
    const processingTime = Date.now() - startTime;

    // Shutdown processor
    await processor.shutdown();

    // Prepare response
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    return NextResponse.json({
      success: failedResults.length === 0,
      data: {
        processed: successfulResults.map(r => ({
          filename: documents[results.indexOf(r)]?.originalName,
          ...r.result
        })),
        failed: failedResults.map(r => ({
          filename: documents[results.indexOf(r)]?.originalName,
          error: r.error?.message,
          retries: r.retries
        })),
        summary: {
          total: files.length,
          successful: successfulResults.length,
          failed: failedResults.length,
          processingTime,
          averageTimePerDocument: processingTime / files.length
        }
      },
      processingTime,
      metrics
    }, {
      status: failedResults.length > 0 ? 207 : 200
    });

  } catch (error) {
    console.error('Parallel upload error:', error);
    
    // Ensure processor is shut down
    try {
      await processor.shutdown();
    } catch {}

    return NextResponse.json({
      success: false,
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

function validateFiles(files: File[]): { valid: boolean; error?: string; details?: string } {
  // Check file count
  if (files.length > 20) {
    return {
      valid: false,
      error: 'Too many files',
      details: `Maximum 20 files allowed, received ${files.length}`
    };
  }

  // Check file types
  const invalidTypes = files.filter(file => 
    !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')
  );
  
  if (invalidTypes.length > 0) {
    return {
      valid: false,
      error: 'Invalid file types',
      details: `Only PDF files allowed. Invalid: ${invalidTypes.map(f => f.name).join(', ')}`
    };
  }

  // Check file sizes
  const maxSize = 4.5 * 1024 * 1024; // 4.5MB
  const oversized = files.filter(file => file.size > maxSize);
  
  if (oversized.length > 0) {
    return {
      valid: false,
      error: 'Files too large',
      details: `Maximum 4.5MB per file. Oversized: ${oversized.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`
      ).join(', ')}`
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total
  
  if (totalSize > maxTotalSize) {
    return {
      valid: false,
      error: 'Total size too large',
      details: `Maximum 50MB total, received ${(totalSize / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { valid: true };
}

async function processWithStreaming(
  processor: ParallelDocumentProcessor,
  documents: any[],
  options: any
): Promise<any[]> {
  const results: any[] = [];
  
  console.log('Processing documents with streaming...');
  
  for await (const result of processor.processDocumentStream(documents, options)) {
    results.push(result);
    console.log(`Completed: ${results.length}/${documents.length}`);
  }
  
  return results;
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}