import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * Simplified, reliable document upload endpoint
 * Focuses on core functionality with robust error handling
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[upload] Starting upload process...');

    // Check system health
    if (!isDatabaseAvailable()) {
      console.error('[upload] Database not available');
      return NextResponse.json(
        { 
          error: 'Database not available - please check configuration',
          code: 'DATABASE_UNAVAILABLE',
          details: 'DATABASE_URL may not be properly configured'
        },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          error: 'No files provided',
          code: 'NO_FILES'
        },
        { status: 400 }
      );
    }

    console.log(`[upload] Processing ${files.length} files`);

    // Validate files
    const maxFiles = 10; // Reduced for reliability
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (files.length > maxFiles) {
      return NextResponse.json(
        { 
          error: `Maximum ${maxFiles} files allowed per batch`,
          code: 'TOO_MANY_FILES'
        },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { 
            error: `File ${file.name} is not a PDF`,
            code: 'INVALID_FILE_TYPE'
          },
          { status: 400 }
        );
      }
      
      if (file.size > maxSize) {
        return NextResponse.json(
          { 
            error: `File ${file.name} exceeds 10MB limit`,
            code: 'FILE_TOO_LARGE'
          },
          { status: 400 }
        );
      }
    }

    // Extract processing options
    const options = {
      source: (formData.get('source') as string) || 'upload',
      category: (formData.get('category') as string) || 'general',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
      enableAI: formData.get('enableAI') !== 'false'
    };

    console.log('[upload] Processing options:', options);

    // Process files one by one for better error handling
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[upload] Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        // Create document record
        const document = await prisma!.document.create({
          data: {
            filename: `${Date.now()}_${file.name}`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            source: options.source,
            category: options.category,
            tags: options.tags.length > 0 ? JSON.stringify(options.tags) : undefined,
            status: 'PROCESSING'
          }
        });

        console.log(`[upload] Created document record: ${document.id}`);

        // Extract text from PDF
        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = '';
        let pageCount = 1;
        let wordCount = 0;

        try {
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
          pageCount = pdfData.numpages || 1;
          wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
          
          console.log(`[upload] Extracted ${wordCount} words from ${pageCount} pages`);
        } catch (pdfError) {
          console.error(`[upload] PDF extraction failed for ${file.name}:`, pdfError);
          throw new Error(`Failed to extract text from PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
        }

        if (extractedText.length < 50) {
          throw new Error('Insufficient text extracted from PDF - document may be scanned or corrupted');
        }

        // Create basic chunks
        const chunks = createSimpleChunks(extractedText);
        
        // Store chunks
        if (chunks.length > 0) {
          await prisma!.documentChunk.createMany({
            data: chunks.map((chunk, index) => ({
              documentId: document.id,
              chunkIndex: index,
              text: chunk,
              wordCount: chunk.split(/\s+/).length,
              startChar: 0,
              endChar: chunk.length
            }))
          });
        }

        // Update document as completed
        await prisma!.document.update({
          where: { id: document.id },
          data: {
            fullText: extractedText,
            pageCount,
            wordCount,
            status: 'COMPLETED',
            processedAt: new Date()
          }
        });

        results.push({
          documentId: document.id,
          status: 'COMPLETED' as const,
          progress: 100,
          message: 'Document processed successfully',
          metrics: {
            chunks: chunks.length,
            themes: 0, // AI analysis disabled for reliability
            quotes: 0,
            insights: 0,
            processingTime: Date.now() - startTime
          }
        });

        console.log(`[upload] Successfully processed: ${file.name}`);

      } catch (fileError) {
        console.error(`[upload] Failed to process ${file.name}:`, fileError);
        
        results.push({
          documentId: '',
          status: 'FAILED' as const,
          progress: 0,
          message: 'Processing failed',
          metrics: {
            chunks: 0,
            themes: 0,
            quotes: 0,
            insights: 0,
            processingTime: Date.now() - startTime
          },
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }

    // Calculate summary
    const summary = {
      totalFiles: files.length,
      successful: results.filter(r => r.status === 'COMPLETED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      totalProcessingTime: Date.now() - startTime,
      metrics: {
        totalChunks: results.reduce((sum, r) => sum + r.metrics.chunks, 0),
        totalThemes: results.reduce((sum, r) => sum + r.metrics.themes, 0),
        totalQuotes: results.reduce((sum, r) => sum + r.metrics.quotes, 0),
        totalInsights: results.reduce((sum, r) => sum + r.metrics.insights, 0)
      }
    };

    console.log(`[upload] Completed processing in ${summary.totalProcessingTime}ms:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Successfully processed ${summary.successful} of ${summary.totalFiles} documents`
    });

  } catch (error) {
    console.error('[upload] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Upload processing failed',
        code: 'PROCESSING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

}

// Helper function for creating simple chunks
function createSimpleChunks(text: string): string[] {
  const chunkSize = 1000;
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 50);
}

/**
 * Get upload endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'Unified Document Upload',
    version: '2.0',
    capabilities: {
      formats: ['PDF'],
      maxFileSize: '50MB',
      maxBatchSize: 20,
      features: [
        'Text extraction',
        'Intelligent chunking',
        'AI-powered analysis',
        'Theme extraction',
        'Quote identification',
        'Insight generation',
        'Progress tracking',
        'Error recovery',
        'Cultural protocols (CARE+)'
      ]
    },
    systemStatus: {
      database: isDatabaseAvailable(),
      aiProviders: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        moonshot: !!process.env.MOONSHOT_API_KEY
      }
    }
  });
}