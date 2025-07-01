import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
import { DocumentChunker } from '@/utils/document-chunker';

export const maxDuration = 60; // 1 minute max
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[quick-upload] Request received');
  
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[quick-upload] Processing: ${file.name}`);

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractor = new ImprovedPDFExtractor(buffer);
    const extraction = await extractor.extractText();
    
    // Calculate word count
    const wordCount = extraction.text.trim() ? extraction.text.trim().split(/\s+/).length : 0;
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        originalName: file.name,
        mimeType: 'application/pdf',
        size: buffer.length,
        fullText: extraction.text,
        pageCount: extraction.pageCount,
        wordCount: wordCount,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Create simple chunks
    const chunker = new DocumentChunker();
    const chunks = chunker.chunkDocument(extraction.text);
    
    // Store chunks
    await prisma.documentChunk.createMany({
      data: chunks.map((chunk, idx) => ({
        documentId: document.id,
        chunkIndex: idx,
        text: chunk.text,
        wordCount: chunk.wordCount || 0,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        startPage: 0,
        endPage: 0
      }))
    });

    console.log(`[quick-upload] Success: ${document.id}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: 1,
        successful: 1,
        failed: 0,
        totalChunks: chunks.length,
        totalThemes: 0,
        totalQuotes: 0,
        totalInsights: 0,
        totalKeywords: 0
      },
      results: [{
        documentId: document.id,
        status: 'COMPLETED',
        chunks: chunks.length,
        themes: 0,
        quotes: 0,
        insights: 0,
        keywords: 0
      }],
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('[quick-upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}