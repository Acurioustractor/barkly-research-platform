import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Test upload endpoint that works without database
 * Just processes files and returns results without storing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[test-upload] Starting test upload...');

    // Get files
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`[test-upload] Processing ${files.length} files`);

    const results = [];

    for (const file of files) {
      try {
        console.log(`[test-upload] Processing: ${file.name}`);

        // Basic validation
        if (file.type !== 'application/pdf') {
          throw new Error('Only PDF files allowed');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File too large (max 10MB)');
        }

        // Try to extract text
        let extractedText = '';
        let wordCount = 0;
        let pageCount = 1;
        let extractionSuccess = false;

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          
          extractedText = pdfData.text || '';
          pageCount = pdfData.numpages || 1;
          wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
          extractionSuccess = true;

          console.log(`[test-upload] Extracted ${wordCount} words from ${pageCount} pages`);
        } catch (pdfError) {
          console.error(`[test-upload] PDF extraction failed:`, pdfError);
          extractedText = `PDF extraction failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`;
          extractionSuccess = false;
        }

        // Create mock document ID
        const mockDocumentId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        results.push({
          documentId: mockDocumentId,
          filename: file.name,
          status: extractionSuccess && extractedText.length > 50 ? 'COMPLETED' : 'FAILED',
          wordCount,
          pageCount,
          textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
          fileSize: file.size,
          error: !extractionSuccess || extractedText.length <= 50 ? 'Insufficient text extracted or PDF processing failed' : undefined
        });

        console.log(`[test-upload] Completed: ${file.name} - ${extractionSuccess ? 'SUCCESS' : 'FAILED'}`);

      } catch (fileError) {
        console.error(`[test-upload] File processing failed:`, fileError);
        
        results.push({
          documentId: '',
          filename: file.name,
          status: 'FAILED',
          wordCount: 0,
          pageCount: 0,
          textPreview: '',
          fileSize: file.size,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.status === 'COMPLETED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;

    console.log(`[test-upload] Summary: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: files.length,
        successful,
        failed,
        note: 'This is a test upload - files are processed but not stored in database'
      },
      results,
      message: `Processed ${successful} of ${files.length} files successfully (test mode - no database storage)`
    });

  } catch (error) {
    console.error('[test-upload] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Test upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Test Document Upload',
    status: 'active',
    note: 'This endpoint processes files without database storage - for testing only',
    features: ['PDF upload', 'Text extraction', 'Basic validation'],
    limits: {
      maxFileSize: '10MB',
      supportedTypes: ['application/pdf']
    }
  });
}