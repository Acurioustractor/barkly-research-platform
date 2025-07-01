import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export const maxDuration = 10; // 10 seconds max
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[simple-store] Request received');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file. Only PDFs are supported.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    console.log(`[simple-store] Storing: ${file.name} (${file.size} bytes)`);

    // Just store the basic document info
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        originalName: file.name,
        mimeType: 'application/pdf',
        size: buffer.length,
        fullText: '', // Will be extracted later
        pageCount: 0,
        wordCount: 0,
        status: 'PENDING', // Mark as pending for background processing
        uploadedAt: new Date()
      }
    });

    console.log(`[simple-store] Document stored with ID: ${document.id}`);

    // Return immediately - processing will happen in background
    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: 1,
        successful: 1,
        failed: 0,
        totalChunks: 0,
        totalThemes: 0,
        totalQuotes: 0,
        totalInsights: 0,
        totalKeywords: 0
      },
      results: [{
        documentId: document.id,
        status: 'PENDING',
        chunks: 0,
        themes: 0,
        quotes: 0,
        insights: 0,
        keywords: 0,
        message: 'Document stored successfully. Processing will begin shortly.'
      }],
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('[simple-store] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}