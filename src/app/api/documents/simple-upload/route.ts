import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 60; // 1 minute - much shorter
export const dynamic = 'force-dynamic';

/**
 * Super simple upload endpoint that just stores files without complex processing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[simple-upload] Starting...');

    // Check database
    if (!isDatabaseAvailable() || !prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get files
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`[simple-upload] Processing ${files.length} files`);

    const results = [];

    for (const file of files) {
      try {
        console.log(`[simple-upload] Processing: ${file.name}`);

        // Basic validation
        if (file.type !== 'application/pdf') {
          throw new Error('Only PDF files allowed');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File too large (max 10MB)');
        }

        // Create document record
        const document = await prisma.document.create({
          data: {
            filename: `${Date.now()}_${file.name}`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            source: 'simple_upload',
            category: 'general',
            status: 'PROCESSING'
          }
        });

        console.log(`[simple-upload] Created document: ${document.id}`);

        // Try to extract text
        let extractedText = '';
        let wordCount = 0;
        let pageCount = 1;

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          
          extractedText = pdfData.text || '';
          pageCount = pdfData.numpages || 1;
          wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;

          console.log(`[simple-upload] Extracted ${wordCount} words from ${pageCount} pages`);
        } catch (pdfError) {
          console.error(`[simple-upload] PDF extraction failed:`, pdfError);
          extractedText = `[PDF extraction failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}]`;
          wordCount = 0;
        }

        // Update document
        await prisma.document.update({
          where: { id: document.id },
          data: {
            fullText: extractedText,
            pageCount,
            wordCount,
            status: extractedText.length > 50 ? 'COMPLETED' : 'FAILED',
            processedAt: new Date(),
            errorMessage: extractedText.length <= 50 ? 'Insufficient text extracted' : undefined
          }
        });

        results.push({
          documentId: document.id,
          filename: file.name,
          status: extractedText.length > 50 ? 'COMPLETED' : 'FAILED',
          wordCount,
          pageCount,
          error: extractedText.length <= 50 ? 'Insufficient text extracted' : undefined
        });

        console.log(`[simple-upload] Completed: ${file.name}`);

      } catch (fileError) {
        console.error(`[simple-upload] File processing failed:`, fileError);
        
        results.push({
          documentId: '',
          filename: file.name,
          status: 'FAILED',
          wordCount: 0,
          pageCount: 0,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.status === 'COMPLETED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;

    console.log(`[simple-upload] Summary: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: files.length,
        successful,
        failed
      },
      results,
      message: `Processed ${successful} of ${files.length} files successfully`
    });

  } catch (error) {
    console.error('[simple-upload] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Simple Document Upload',
    status: 'active',
    features: ['PDF upload', 'Text extraction', 'Basic validation'],
    limits: {
      maxFileSize: '10MB',
      supportedTypes: ['application/pdf']
    }
  });
}