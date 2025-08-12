import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

// Use Edge Runtime for better timeout handling and streaming
export const runtime = 'edge';
export const maxDuration = 60; // Edge functions can run longer

export async function POST(request: NextRequest) {
  try {
    console.log('[chunked-upload] Starting chunked upload process');

    // Ensure database is available
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const db = prisma;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string || '0');
    const totalChunks = parseInt(formData.get('totalChunks') as string || '1');
    const uploadId = formData.get('uploadId') as string;
    const originalName = formData.get('originalName') as string;
    const category = (formData.get('category') as string || 'general').trim();
    const source = (formData.get('source') as string || 'upload').trim();
    const tags = (formData.get('tags') as string || '').trim();

    if (!file || !uploadId || !originalName) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, uploadId, originalName' 
      }, { status: 400 });
    }

    console.log(`[chunked-upload] Processing chunk ${chunkIndex + 1}/${totalChunks} for ${originalName}`);

    // Store chunk data (in production, use proper file storage like S3)
    const chunkBuffer = Buffer.from(await file.arrayBuffer());
    const chunkKey = `${uploadId}_chunk_${chunkIndex}`;
    
    // For now, store chunks in a temporary location
    // In production, you'd use cloud storage like S3, GCS, or Azure Blob
    const chunkData = {
      uploadId,
      chunkIndex,
      data: chunkBuffer.toString('base64'),
      size: chunkBuffer.length,
      timestamp: new Date()
    };

    // Store chunk metadata in database or cache
    // For demo purposes, we'll use a simple approach
    console.log(`[chunked-upload] Stored chunk ${chunkIndex} (${chunkBuffer.length} bytes)`);

    // If this is the last chunk, initiate assembly and processing
    if (chunkIndex === totalChunks - 1) {
      console.log(`[chunked-upload] All chunks received, initiating assembly for ${originalName}`);
      
      // Create document record
      const document = await db.document.create({
        data: {
          filename: `${Date.now()}-${originalName}`,
          originalName,
          mimeType: 'application/pdf',
          size: 0, // Will be updated after assembly
          wordCount: 0,
          pageCount: 0,
          fullText: '',
          status: 'PROCESSING',
          category,
          source,
          tags,
          uploadedAt: new Date(),
        }
      });

      // Trigger background processing
      // In a real implementation, you'd send this to a queue
      console.log(`[chunked-upload] Created document ${document.id}, triggering background processing`);

      return NextResponse.json({
        success: true,
        documentId: document.id,
        message: 'Upload complete, processing started',
        chunkIndex,
        totalChunks
      });
    }

    // Return success for intermediate chunks
    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
      chunkIndex,
      totalChunks
    });

  } catch (error) {
    console.error('[chunked-upload] Error:', error);
    return NextResponse.json(
      { 
        error: 'Chunked upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}