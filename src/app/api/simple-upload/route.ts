import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Just save basic info without processing
    const document = await prisma?.document.create({
      data: {
        filename: `simple_${Date.now()}_${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        status: 'COMPLETED',
        fullText: 'File uploaded successfully without processing',
        processedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded without processing',
      document: {
        id: document?.id,
        name: document?.originalName,
        size: document?.size
      }
    });
  } catch (error) {
    console.error('Simple upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}